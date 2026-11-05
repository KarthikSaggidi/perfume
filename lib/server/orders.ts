import {randomUUID} from 'node:crypto';
import {productPrice,baseProductPrice,type BottleSize} from '../products';
import type {Address,Customer,Order,OrderStatus} from '../commerce-types';
import type {StoreState} from './store';
import {audit} from './store';
import {customerFestivalOffer} from '../festival-offer';
import {ApiError,emailValue,phoneValue,requiredText,text} from './security';
export function validateAddress(body:Record<string,unknown>,existing?:Address):Address{
 const country=text(body.country||'India',60);if(!['India','IN'].includes(country))throw new ApiError('Delivery is currently available within India.');
 const postalCode=typeof body.postalCode==='string'?body.postalCode.trim():'';if(!/^[1-9][0-9]{5}$/.test(postalCode))throw new ApiError('Enter a valid six-digit Indian PIN code.');
 return{id:existing?.id||randomUUID(),label:text(body.label||'Home',40),name:requiredText(body.name,'the recipient’s name',100,2),phone:phoneValue(body.phone),line1:requiredText(body.line1,'a street address',200,5),line2:text(body.line2,200),city:requiredText(body.city,'a city',100,2),state:requiredText(body.state,'a state',100,2),postalCode,country:'India',isDefault:body.isDefault===true};
}
export function publicOrder(order:Order):Order{return{...order,internalNote:''}}
export const allowedTransitions:Record<OrderStatus,OrderStatus[]>={pending:['confirmed','cancelled'],confirmed:['processing','cancelled'],processing:['shipped','cancelled'],shipped:['delivered'],delivered:[],cancelled:[]};
export function transitionOrder(state:StoreState,order:Order,status:OrderStatus,actor:string){
 if(order.status===status)return;
 if(!allowedTransitions[order.status].includes(status))throw new ApiError(`An order cannot move from ${order.status} to ${status}.`,409);
 if(status==='cancelled')for(const line of order.items){const product=state.products.find(p=>p.id===line.productId);if(product)product.stock+=line.quantity}
 order.status=status;order.updatedAt=new Date().toISOString();order.events.push({status,note:status==='cancelled'?'Order cancelled.':`Order ${status}.`,createdAt:order.updatedAt});audit(state,actor,`Order ${status}`,order.number);
}
export function createOrder(state:StoreState,customer:Customer,body:Record<string,unknown>):Order{
 const idempotencyKey=requiredText(body.idempotencyKey,'a checkout reference',100,8),existing=state.orders.find(o=>o.customerId===customer.id&&o.idempotencyKey===idempotencyKey);if(existing)return existing;
 if(state.settings.maintenanceMode)throw new ApiError('The store is temporarily unavailable for new orders.',503);
 if(!state.settings.codEnabled)throw new ApiError('Checkout is not available yet. Please contact the store.',409);
 if(customer.status!=='active')throw new ApiError('This account is unavailable.',403);
 let address=customer.addresses.find(a=>a.id===text(body.addressId,100));
 if(!address&&body.address&&typeof body.address==='object')address=validateAddress(body.address as Record<string,unknown>);
 if(!address)throw new ApiError('Choose a delivery address.');
 if(!Array.isArray(body.items)||body.items.length<1||body.items.length>100)throw new ApiError('Your cart must contain at least one fragrance.');
 const quantities=new Map<string,{id:string;size:BottleSize;quantity:number}>();
 for(const value of body.items){if(!value||typeof value!=='object')throw new ApiError('Your cart contains an invalid item.');const item=value as Record<string,unknown>,id=text(item.productId,100),size=item.size===100?100:50,quantity=Number(item.quantity);if((item.size!==50&&item.size!==100)||!Number.isInteger(quantity)||quantity<1||quantity>99)throw new ApiError('Choose a valid bottle size and quantity.');const key=`${id}:${size}`,previous=quantities.get(key);quantities.set(key,{id,size,quantity:(previous?.quantity||0)+quantity})}
 const offer=customerFestivalOffer(state.settings,state.leads,customer.phone);
 const requiredStock=new Map<string,number>();
 const lines=[...quantities.values()].map(line=>{const product=state.products.find(p=>p.id===line.id&&p.status==='active');if(!product)throw new ApiError('A fragrance in your cart is no longer available.',409);if(line.quantity>99)throw new ApiError('Choose no more than 99 bottles of each size.');requiredStock.set(product.id,(requiredStock.get(product.id)||0)+line.quantity);const unitPrice=productPrice({...product,offer:offer.unlocked&&offer.productIds.includes(product.id)?{percent:offer.percent,label:`${offer.name||'Diwali'} offer`}:undefined},line.size);return{productId:product.id,name:product.name,sku:product.sku,image:product.image,size:line.size,quantity:line.quantity,unitPrice,total:Math.round(unitPrice*100)*line.quantity/100}});
 for(const [id,quantity] of requiredStock){const product=state.products.find(p=>p.id===id)!;if(product.stock<quantity)throw new ApiError(`${product.name} has ${product.stock} ${product.stock===1?'bottle':'bottles'} available. Please update your cart.`,409)}
 const festivalApplied=offer.unlocked&&lines.some(line=>offer.productIds.includes(line.productId)&&line.unitPrice<baseProductPrice(state.products.find(product=>product.id===line.productId)!,line.size));
 const originalSubtotal=Math.round(lines.reduce((sum,line)=>sum+baseProductPrice(state.products.find(product=>product.id===line.productId)!,line.size)*line.quantity,0)*100)/100;
 const subtotal=Math.round(lines.reduce((n,p)=>n+p.total,0)*100)/100,shipping=festivalApplied&&offer.freeShipping?0:state.settings.freeShippingThreshold>0&&subtotal>=state.settings.freeShippingThreshold?0:state.settings.shippingFee,tax=Math.round(subtotal*state.settings.taxRate)/100,total=Math.round((subtotal+shipping+tax)*100)/100;
 if(body.expectedTotal!==undefined&&(!Number.isFinite(Number(body.expectedTotal))||Math.abs(Number(body.expectedTotal)-total)>.01))throw new ApiError('Prices or delivery charges have changed. Please review your refreshed order total.',409);
 if(body.email!==undefined)customer.email=emailValue(body.email);
 for(const [id,quantity] of requiredStock){const product=state.products.find(p=>p.id===id)!;product.stock-=quantity;product.updatedAt=new Date().toISOString()}
 const claimedLead=festivalApplied?state.leads?.find(lead=>lead.phone===customer.phone&&lead.status!=='archived'):undefined;if(claimedLead){claimedLead.customerId=customer.id;claimedLead.status='converted';claimedLead.updatedAt=new Date().toISOString()}
 const now=new Date().toISOString();state.orderSequence++;
 const order:Order={id:randomUUID(),number:`${state.settings.orderPrefix}-${String(state.orderSequence).padStart(6,'0')}`,customerId:customer.id,customerName:address.name,phone:customer.phone,email:customer.email,items:lines,address:{...address},subtotal,shipping,tax,total,...(originalSubtotal>subtotal?{offer:{label:festivalApplied?`${offer.name||'Diwali'} offer`:'Product offer',percent:festivalApplied?offer.percent:Math.round((1-subtotal/originalSubtotal)*100),discount:Math.round((originalSubtotal-subtotal)*100)/100,originalSubtotal}}:{}),status:'pending',paymentStatus:'unpaid',paymentMethod:'cod',trackingNumber:'',trackingUrl:'',carrier:'',internalNote:'',customerNote:text(body.customerNote,1000),idempotencyKey,events:[{status:'pending',note:'Order received. Payment is due on delivery.',createdAt:now}],createdAt:now,updatedAt:now};state.orders.push(order);if(!customer.name)customer.name=address.name;customer.updatedAt=now;audit(state,customer.phone,'Placed order',order.number);return order;
}
