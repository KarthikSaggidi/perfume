import {randomUUID} from 'node:crypto';
import {parseCsv,toCsv,transferResources,type ImportResource} from '../admin-transfer';
import type {AdminUser,Customer,OrderStatus,StoreSettings} from '../commerce-types';
import {productValue,posterValue,settingsValue} from './admin-values';
import {audit,mutateStore,readStore,type StoreState} from './store';
import {ApiError,boundedBody,digest,emailValue,json,numberValue,phoneValue,requireAdmin,requiredText,text,urlValue} from './security';
import {transitionOrder} from './orders';
import {updateInventory} from './inventory';
import {adminRecords,assertAdminResourceAccess} from './admin-records';

const boolean=(value:string)=>{if(!['true','false'].includes(value.toLowerCase()))throw new ApiError('Use true or false for boolean fields.');return value.toLowerCase()==='true'};
const snapshot=(state:StoreState,resource:ImportResource)=>digest(JSON.stringify(resource==='orders'?[state.orders,state.products]:resource==='inventory'?state.products:resource==='team'?state.admins:state[resource]));
export async function handleDataExport(request:Request){
 const admin=await requireAdmin(),params=new URL(request.url).searchParams,resource=params.get('resource')||undefined;assertAdminResourceAccess(resource,admin.role);
 const state=await readStore(),data=adminRecords(state,resource,params);
 const keys=transferResources[resource].columns,rows:unknown[][]=[[...keys]];
 if(params.get('template')!=='1')rows.push(...data.map(record=>keys.map(key=>Array.isArray(record[key])?(record[key] as unknown[]).join('|'):record[key])));
 return new Response(toCsv(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="velora-${resource}${params.get('template')==='1'?'-template':''}.csv"`,'Cache-Control':'no-store'}});
}
function applyRows(state:StoreState,resource:ImportResource,rows:Record<string,string>[],admin:AdminUser){
 const results:{row:number;action:string;label:string}[]=[],seen=new Set<string>();
 for(const [index,input]of rows.entries()){
  try{
   const allowed:readonly string[]=transferResources[resource].columns;
   if(Object.keys(input).some(key=>!allowed.includes(key)))throw new ApiError('Use column names from the downloaded template.');
   const row=Object.fromEntries(Object.entries(input).filter(([,value])=>value!==''));
   let key='',label='',action='Update';
   if(resource==='products'){
    const previous=state.products.find(product=>row.id?product.id===row.id:row.sku&&product.sku===row.sku);
    const body:Record<string,unknown>={...previous,...row};
    for(const field of ['notes','badge','description'])if(input[field]!==undefined)body[field]=input[field];
    if(row.featured!==undefined)body.featured=boolean(row.featured);
    for(const field of ['topNotes','heartNotes','baseNotes'])if(input[field]!==undefined)body[field]=input[field].split('|').filter(Boolean);
    if(input.price100==='')body.price100='';
    const product=productValue(body,previous);if(state.products.some(item=>item.id!==previous?.id&&(item.id===product.id||item.sku===product.sku)))throw new ApiError('This product ID or SKU is already in use.');
    if(previous)state.products[state.products.indexOf(previous)]=product;else{state.products.push(product);action='Create'}key=product.id;label=product.name;
   }else if(resource==='inventory'){
    const product=state.products.find(product=>row.id?product.id===row.id:product.sku===row.sku);if(!product)throw new ApiError('The product does not exist.');
    updateInventory(state,[{id:product.id,stock:row.stock,expectedStock:row.expectedStock}]);key=product.id;label=product.name;
   }else if(resource==='posters'){
    const previous=state.posters.find(poster=>row.id?poster.id===row.id:poster.name===row.name);
    const body:Record<string,unknown>={...previous,...row,...(row.active===undefined?{}:{active:boolean(row.active)})};
    for(const field of ['eyebrow','description','mobileImage','productId','startsAt','endsAt'])if(input[field]!==undefined)body[field]=input[field];
    const poster=posterValue(body,previous);
    if(poster.productId&&!state.products.some(product=>product.id===poster.productId))throw new ApiError('The linked product does not exist.');
    if(previous)state.posters[state.posters.indexOf(previous)]=poster;else{state.posters.push(poster);action='Create'}key=poster.id;label=poster.name;
   }else if(resource==='orders'){
    const order=state.orders.find(order=>row.id?order.id===row.id:order.number===row.number);if(!order)throw new ApiError('Only existing orders can be updated.');if(row.number&&row.number!==order.number)throw new ApiError('The order ID and order number do not match.');
    if(row.status){if(!['pending','confirmed','processing','shipped','delivered','cancelled'].includes(row.status))throw new ApiError('Choose a valid fulfilment status.');transitionOrder(state,order,row.status as OrderStatus,admin.email)}
    if(row.paymentStatus){if(!['unpaid','paid','refunded'].includes(row.paymentStatus))throw new ApiError('Choose a valid payment status.');if(row.paymentStatus==='refunded'&&!['paid','refunded'].includes(order.paymentStatus))throw new ApiError('Only a paid order can be marked refunded.');order.paymentStatus=row.paymentStatus as typeof order.paymentStatus}
    for(const field of ['carrier','trackingNumber','internalNote']as const)if(input[field]!==undefined)order[field]=text(input[field],field==='internalNote'?5000:200);
    if(input.trackingUrl!==undefined)order.trackingUrl=urlValue(input.trackingUrl);order.updatedAt=new Date().toISOString();key=order.id;label=order.number;
   }else if(resource==='customers'){
    const phone=phoneValue(row.phone),previous=state.customers.find(customer=>row.id?customer.id===row.id:customer.phone===phone);
    if(row.id&&!previous)throw new ApiError('This customer ID was not found. Leave ID empty for a new customer.');if(previous&&previous.phone!==phone)throw new ApiError('Existing sign-in phone numbers cannot be changed.');
    if(state.customers.some(customer=>customer.phone===phone&&customer.id!==previous?.id))throw new ApiError('This phone number belongs to another customer.');
    const now=new Date().toISOString(),customer:Customer=previous||{id:randomUUID(),phone,name:'',email:'',addresses:[],wishlist:[],tags:[],notes:'',marketingConsent:false,status:'active',createdAt:now,updatedAt:now,lastLoginAt:''};
    for(const field of ['name','notes']as const)if(input[field]!==undefined)customer[field]=text(input[field],field==='notes'?5000:100);
    if(input.email!==undefined)customer.email=emailValue(input.email);if(input.tags!==undefined)customer.tags=[...new Set(input.tags.split('|').map(tag=>text(tag,100)).filter(Boolean))].slice(0,20);
    if(row.status){if(!['active','blocked'].includes(row.status))throw new ApiError('Choose an active or blocked customer status.');customer.status=row.status as Customer['status']}
    if(customer.status==='blocked')state.sessions=state.sessions.filter(session=>session.kind!=='customer'||session.subjectId!==customer.id);
    customer.updatedAt=now;if(!previous){state.customers.push(customer);action='Create'}key=customer.id;label=customer.name||customer.phone;
   }else if(resource==='settings'){
    key=requiredText(row.key,'a settings key',100);if(!Object.hasOwn(state.settings,key)||key==='currency')throw new ApiError('Choose an editable store setting.');
    const old=state.settings[key as keyof StoreSettings],value=Array.isArray(old)?(input.value||'').split('|').filter(Boolean):typeof old==='boolean'?boolean(input.value||''):typeof old==='number'?numberValue(input.value,'settings value'):input.value??'';
    state.settings=settingsValue({[key]:value},state.settings);label=key;
   }else{
    const person=state.admins.find(person=>row.id?person.id===row.id:person.email===emailValue(row.email,true));if(!person)throw new ApiError('Create new staff using Add team member. This import updates existing staff only.');if(row.email&&emailValue(row.email)!==person.email)throw new ApiError('The staff ID and email do not match. Sign-in emails cannot be changed by import.');
    const role=row.role||person.role;if(!['owner','manager','support'].includes(role))throw new ApiError('Choose a valid staff role.');
    const active=row.active===undefined?person.active:boolean(row.active);
    if(person.id===admin.id&&(!active||role!=='owner'))throw new ApiError('You cannot deactivate or demote your own owner account.');
    if(person.role==='owner'&&(!active||role!=='owner')&&state.admins.filter(person=>person.active&&person.role==='owner').length<=1)throw new ApiError('Keep at least one active owner.');
    person.name=requiredText(row.name||person.name,'a name',100,2);person.role=role as typeof person.role;person.active=active;person.updatedAt=new Date().toISOString();if(!active)state.sessions=state.sessions.filter(session=>session.kind!=='admin'||session.subjectId!==person.id);key=person.id;label=person.email;
   }
   if(seen.has(key))throw new ApiError('The same record appears more than once.');seen.add(key);results.push({row:index+2,action,label});
  }catch(error){throw new ApiError(`Row ${index+2}: ${error instanceof Error?error.message:'Invalid data.'}`)}
 }
 return results;
}
export async function handleDataImport(request:Request,resource:string|undefined,admin:AdminUser){
 assertAdminResourceAccess(resource,admin.role);if(resource==='leads')throw new ApiError('Offer leads are captured by the storefront. Manage their follow-up status in Offer leads.');if(resource==='activity')throw new ApiError('Activity is generated automatically. Import store records instead.');
 if(!request.headers.get('content-type')?.includes('application/json'))throw new ApiError('Send a JSON import request.');
 let body:Record<string,unknown>;try{body=JSON.parse((await boundedBody(request,520000)).toString('utf8'))}catch(error){if(error instanceof ApiError)throw error;throw new ApiError('Choose a valid CSV file.')}
 if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.csv!=='string'||!['preview','commit'].includes(String(body.mode)))throw new ApiError('Preview a CSV before importing.');
 const csv=body.csv;
 let rows:Record<string,string>[];try{rows=parseCsv(csv)}catch(error){throw new ApiError(error instanceof Error?error.message:'The CSV could not be read.')}
 if(body.mode==='preview'){
  const state=await readStore(),revision=digest(snapshot(state,resource)+digest(csv)+admin.id),results=applyRows(structuredClone(state),resource,rows,admin);
  return json({snapshot:revision,count:results.length,created:results.filter(row=>row.action==='Create').length,updated:results.filter(row=>row.action==='Update').length,rows:results});
 }
 const result=await mutateStore(state=>{if(body.snapshot!==digest(snapshot(state,resource)+digest(csv)+admin.id))throw new ApiError('Store records changed after your preview. Preview the file again before importing.',409);const results=applyRows(state,resource,rows,admin);audit(state,admin.email,'Imported CSV',`${resource}: ${results.length} records`);return results.length});
 return json({imported:result});
}
