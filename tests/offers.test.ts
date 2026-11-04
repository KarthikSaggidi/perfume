import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../lib/server/store';
import {createOrder} from '../lib/server/orders';
import {settingsValue} from '../lib/server/admin-values';
import {customerFestivalOffer,festivalConfig} from '../lib/festival-offer';
import {baseProductPrice,productPrice} from '../lib/products';
import type {Customer,OfferLead} from '../lib/commerce-types';
function fixture(){
 const state=initialState(),now=new Date().toISOString();
 const customer:Customer={id:'festival-customer',phone:'+919000000041',name:'Festival Customer',email:'',addresses:[],wishlist:[],tags:[],notes:'',marketingConsent:false,status:'active',createdAt:now,updatedAt:now,lastLoginAt:now};
 const lead:OfferLead={id:'festival-lead',name:'Festival Customer',phone:customer.phone,email:'',marketingConsent:false,source:'diwali-popup',status:'new',notes:'',createdAt:now,updatedAt:now};
 state.leads=[lead];state.customers=[customer];state.settings={...state.settings,codEnabled:true,shippingFee:90,taxRate:5,festivalOfferProductIds:['velvet']};for(const product of state.products)product.stock=5;
 return{state,customer,lead};
}
const address={name:'Festival Customer',phone:'+919000000041',line1:'123 Festival Street',city:'Hyderabad',state:'Telangana',postalCode:'500001',country:'India'};
const payload={idempotencyKey:'festival-order-test',items:[{productId:'velvet',size:50,quantity:1},{productId:'flora',size:50,quantity:1}],address};
test('festival eligibility uses a saved non-archived lead for the verified checkout phone',()=>{
 const {state,customer,lead}=fixture();
 assert.equal(customerFestivalOffer(state.settings,state.leads,customer.phone).unlocked,true);
 assert.equal(customerFestivalOffer(state.settings,state.leads,'+919000000042').unlocked,false);
 lead.status='archived';assert.equal(customerFestivalOffer(state.settings,state.leads,customer.phone).unlocked,false);
 lead.status='converted';assert.equal(customerFestivalOffer(state.settings,state.leads,customer.phone).unlocked,true);
 assert.equal(customerFestivalOffer({...state.settings,festivalOfferEnabled:false},state.leads,customer.phone).unlocked,false);
});
test('server applies savings only to eligible lines, preserves tax rounding and grants conditional delivery',()=>{
 const {state,customer,lead}=fixture(),order=createOrder(state,customer,{...payload,unitPrice:1,discount:99,offer:{percent:99}});
 assert.equal(order.items[0].unitPrice,4874.25);assert.equal(order.items[1].unitPrice,5499);
 assert.equal(order.subtotal,10373.25);assert.equal(order.shipping,0);assert.equal(order.tax,518.66);assert.equal(order.total,10891.91);
 assert.deepEqual(order.offer,{label:'Diwali offer',percent:25,discount:1624.75,originalSubtotal:11998});
 assert.equal(lead.status,'converted');assert.equal(lead.customerId,customer.id);
 assert.equal(createOrder(state,customer,payload).id,order.id,'Retrying checkout does not consume stock twice');
});
test('unclaimed or ineligible carts pay normal prices and delivery, and stale totals fail before stock changes',()=>{
 const {state,customer}=fixture();state.leads=[];
 const first=createOrder(state,customer,payload);assert.equal(first.subtotal,11998);assert.equal(first.shipping,90);assert.equal(first.offer,undefined);
 const other=fixture();const ineligible=createOrder(other.state,other.customer,{...payload,items:[{productId:'flora',size:50,quantity:1}]});assert.equal(ineligible.shipping,90);assert.equal(ineligible.offer,undefined);
 const stale=fixture();stale.state.settings.festivalOfferEnabled=false;
 assert.throws(()=>createOrder(stale.state,stale.customer,{...payload,expectedTotal:10891.91}));assert.equal(stale.state.products.find(product=>product.id==='velvet')!.stock,5);assert.equal(stale.state.orders.length,0);
});
test('100ml prices are derived before applying a single rounded discount',()=>{
 const {state,customer}=fixture(),product=state.products.find(product=>product.id==='velvet')!;
 assert.equal(baseProductPrice(product,100),10398);assert.equal(productPrice({...product,offer:{percent:25,label:'Diwali'}},100),7798.5);
 product.price100=9999.99;const order=createOrder(state,customer,{...payload,items:[{productId:'velvet',size:100,quantity:2}]});assert.equal(order.items[0].unitPrice,7499.99);assert.equal(order.subtotal,14999.98);
});
test('offer schedules and settings reject invalid discounts, dates and empty product selection',()=>{
 assert.equal(festivalConfig({festivalOfferStartsAt:'2030-01-01T00:00:00Z'},Date.parse('2026-11-04')).active,false);
 assert.equal(festivalConfig({festivalOfferEndsAt:'2026-01-01T00:00:00Z'},Date.parse('2026-11-04')).active,false);
 const {state}=fixture();for(const body of [{festivalOfferPercent:99},{festivalOfferPercent:25.5},{festivalOfferEnabled:'true'},{festivalOfferProductIds:[]},{festivalOfferStartsAt:'nonsense'},{festivalOfferStartsAt:'2030-02-01',festivalOfferEndsAt:'2030-01-01'}])assert.throws(()=>settingsValue(body,state.settings));
 assert.equal(settingsValue({festivalOfferEnabled:false,festivalOfferProductIds:[]},state.settings).festivalOfferEnabled,false);
});
