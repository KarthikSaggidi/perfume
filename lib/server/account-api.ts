import {mutateStore,readStore} from './store';
import {ApiError,apiError,bodyJson,checkSurface,checkOrigin,emailValue,json,limit,publicCustomer,requireCustomer,revokeSession,text} from './security';
import {saveAccountReview} from './customer-reviews';
import {createOrder,publicOrder,transitionOrder,validateAddress} from './orders';
export async function handleAccount(request:Request,segments:string[]=[]){try{
 checkSurface(request);
 const identity=await requireCustomer(),resource=segments[0]||'',id=segments[1]||'';
 if(request.method==='GET'&&!resource){const state=await readStore(),user=state.customers.find(c=>c.id===identity.id)!;return json({user:publicCustomer(user),orders:state.orders.filter(o=>o.customerId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(publicOrder)})}
 checkOrigin(request);
 if(resource==='sessions'&&request.method==='DELETE'){await mutateStore(state=>{state.sessions=state.sessions.filter(session=>session.kind!=='customer'||session.subjectId!==identity.id)});await revokeSession('customer');return json({revoked:true})}
 if(resource==='rewards'&&request.method==='POST'){const body=await bodyJson(request);const user=await mutateStore(state=>{const user=state.customers.find(customer=>customer.id===identity.id)!;user.rewardsJoinedAt=user.rewardsJoinedAt||new Date().toISOString();if(typeof body.marketingConsent==='boolean')user.marketingConsent=body.marketingConsent;user.updatedAt=new Date().toISOString();return publicCustomer(user)});return json({user})}
 if(resource==='reviews'&&['POST','PATCH','DELETE'].includes(request.method)){const body=request.method==='DELETE'?{}:await bodyJson(request);const user=await mutateStore(state=>{limit(state,`reviews:${identity.id}`,30,3600000);const user=state.customers.find(customer=>customer.id===identity.id)!;saveAccountReview(state,user,request.method,body,id);return publicCustomer(user)});return json({user},request.method==='POST'?201:200)}
 if(!resource&&request.method==='PATCH'){const body=await bodyJson(request);const user=await mutateStore(state=>{const user=state.customers.find(c=>c.id===identity.id)!;if(body.name!==undefined)user.name=text(body.name,100);if(body.email!==undefined)user.email=emailValue(body.email);if(typeof body.marketingConsent==='boolean')user.marketingConsent=body.marketingConsent;user.updatedAt=new Date().toISOString();return publicCustomer(user)});return json({user})}
 if(resource==='addresses'&&['POST','PATCH','DELETE'].includes(request.method)){
  const body=request.method==='DELETE'?{}:await bodyJson(request);
  const user=await mutateStore(state=>{const user=state.customers.find(c=>c.id===identity.id)!;
   if(request.method==='POST'){if(user.addresses.length>=10)throw new ApiError('You can save up to ten addresses.');const address=validateAddress(body);address.isDefault=address.isDefault||!user.addresses.length;if(address.isDefault)user.addresses.forEach(a=>a.isDefault=false);user.addresses.push(address)}
   else{const index=user.addresses.findIndex(a=>a.id===id);if(index<0)throw new ApiError('Address not found.',404);if(request.method==='DELETE'){const wasDefault=user.addresses[index].isDefault;user.addresses.splice(index,1);if(wasDefault&&user.addresses[0])user.addresses[0].isDefault=true}else{const address=validateAddress({...user.addresses[index],...body},user.addresses[index]);if(address.isDefault)user.addresses.forEach(a=>a.isDefault=false);user.addresses[index]=address;if(!user.addresses.some(a=>a.isDefault)&&user.addresses[0])user.addresses[0].isDefault=true}}
   user.updatedAt=new Date().toISOString();return publicCustomer(user)});return json({user});
 }
 if(resource==='wishlist'&&request.method==='POST'){const body=await bodyJson(request),productId=text(body.productId,100);const wishlist=await mutateStore(state=>{if(body.saved===true&&!state.products.some(p=>p.id===productId&&p.status==='active'))throw new ApiError('Fragrance not found.',404);const user=state.customers.find(c=>c.id===identity.id)!;user.wishlist=body.saved===true?[...new Set([...user.wishlist,productId])]:user.wishlist.filter(p=>p!==productId);user.updatedAt=new Date().toISOString();return user.wishlist});return json({wishlist})}
 if(resource==='orders'&&request.method==='POST'){
  if(id&&segments[2]==='cancel'){const order=await mutateStore(state=>{const order=state.orders.find(o=>o.id===id&&o.customerId===identity.id);if(!order)throw new ApiError('Order not found.',404);if(!['pending','confirmed'].includes(order.status))throw new ApiError('This order can no longer be cancelled online. Please contact the store.',409);transitionOrder(state,order,'cancelled',identity.phone);return publicOrder(order)});return json({order})}
  if(id)throw new ApiError('Not found.',404);
  const body=await bodyJson(request);const order=await mutateStore(state=>{limit(state,`orders:${identity.id}`,20,3600000);const customer=state.customers.find(c=>c.id===identity.id)!;return publicOrder(createOrder(state,customer,body))});return json({order},201);
 }
 throw new ApiError('Not found.',404);
}catch(error){return apiError(error)}}
