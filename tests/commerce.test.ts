import {test,before,after,mock} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {initialState,mutateStore,readStore} from '../lib/server/store';
import {hashPassword,verifyPassword,usernameValue,phoneValue,urlValue,publicCustomer,limit,moneyValue,numberValue,checkOrigin} from '../lib/server/security';
import {createOrder,publicOrder,transitionOrder,validateAddress} from '../lib/server/orders';
import {smsMode,assertSmsRequestAllowed,checkSmsConnection,twilioRequest} from '../lib/server/sms';
import {saveAccountReview} from '../lib/server/customer-reviews';
import {updateInventory} from '../lib/server/inventory';
import {safeAccountReturnTo} from '../components/account/api';
import {parseCsv,toCsv} from '../lib/admin-transfer';
import {createReport,defaultReportFilters} from '../lib/admin-report';
import type {Customer} from '../lib/commerce-types';
let directory='';
before(async()=>{directory=await mkdtemp(path.join(os.tmpdir(),'velora-unit-'));Object.assign(process.env,{VELORA_DATA_DIR:directory,VELORA_LOCAL_STORAGE:'true',NODE_ENV:'test',VELORA_APP_SURFACE:'combined',VELORA_INTEGRATION_TEST:'true'});delete process.env.DATABASE_URL});
after(async()=>{await rm(directory,{recursive:true,force:true})});
const customer=():Customer=>({id:'customer-a',phone:'+919876543210',name:'Test Customer',email:'person@example.test',addresses:[],wishlist:[],tags:['private'],notes:'Private CRM note',marketingConsent:false,status:'active',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),lastLoginAt:new Date().toISOString()});
const address={label:'Home',name:'Test Customer',phone:'+919876543210',line1:'123 Test Street',line2:'',city:'Hyderabad',state:'Telangana',postalCode:'500001',country:'India',isDefault:true};
const payload=(key='checkout-test-one')=>({items:[{productId:'velvet',size:50,quantity:1,unitPrice:1}],address,idempotencyKey:key});
function fixture(){const state=initialState();state.settings.codEnabled=true;state.products.find(p=>p.id==='velvet')!.stock=2;state.customers.push(customer());return state}
test('passwords use independent salted hashes and reject incorrect values',async()=>{const first=await hashPassword('A-strong-password-123'),second=await hashPassword('A-strong-password-123');assert.notEqual(first,second);assert.equal(await verifyPassword('A-strong-password-123',first),true);assert.equal(await verifyPassword('wrong-password',first),false);await assert.rejects(()=>hashPassword('short'))});
test('phone and URL validation reject unsafe or malformed input',()=>{assert.equal(phoneValue('9876543210'),'+919876543210');assert.throws(()=>phoneValue('123'));assert.throws(()=>urlValue('javascript:alert(1)'));assert.throws(()=>urlValue('//evil.example'));assert.throws(()=>urlValue('/\t/evil.example',{internal:true}));assert.throws(()=>urlValue('https://evil.\texample'));assert.throws(()=>urlValue('/images/\u0000bad.webp'));assert.throws(()=>urlValue('https://evil.example',{internal:true}));assert.equal(urlValue('/products/velvet',{internal:true}),'/products/velvet');assert.throws(()=>validateAddress({...address,postalCode:'000000'}))});
test('orders ignore client prices and calculate shipping/tax on the server',()=>{const state=fixture();state.settings.shippingFee=50;state.settings.taxRate=5;const order=createOrder(state,state.customers[0],payload());assert.equal(order.subtotal,6499);assert.equal(order.tax,324.95);assert.equal(order.total,6873.95);assert.equal(state.products.find(p=>p.id==='velvet')!.stock,1);assert.equal(order.paymentStatus,'unpaid')});
test('100 ml overrides, deduplication and idempotency keep inventory accurate',()=>{const state=fixture(),product=state.products.find(p=>p.id==='velvet')!;product.stock=5;product.price100=9999;const input={...payload(),items:[{productId:'velvet',size:100,quantity:1},{productId:'velvet',size:100,quantity:1}]};const order=createOrder(state,state.customers[0],input);assert.equal(order.items.length,1);assert.equal(order.items[0].quantity,2);assert.equal(order.total,19998);assert.equal(createOrder(state,state.customers[0],input).id,order.id);assert.equal(product.stock,3);assert.equal(state.orders.length,1)});
test('price changes and insufficient stock are rejected before mutation',()=>{const state=fixture();assert.throws(()=>createOrder(state,state.customers[0],{...payload(),expectedTotal:1}));assert.equal(state.orders.length,0);assert.equal(state.products.find(p=>p.id==='velvet')!.stock,2);assert.throws(()=>createOrder(state,state.customers[0],{...payload(),items:[{productId:'velvet',size:50,quantity:3}]}));assert.equal(state.orders.length,0)});
test('cancellation restores stock once and invalid fulfilment transitions fail',()=>{const state=fixture(),order=createOrder(state,state.customers[0],payload());transitionOrder(state,order,'cancelled','Test owner');assert.equal(state.products.find(p=>p.id==='velvet')!.stock,2);transitionOrder(state,order,'cancelled','Test owner');assert.equal(state.products.find(p=>p.id==='velvet')!.stock,2);assert.throws(()=>transitionOrder(state,order,'delivered','Test owner'))});
test('public account/order representations omit staff-only information',()=>{const state=fixture(),order=createOrder(state,state.customers[0],payload());order.internalNote='Private fulfilment note';assert.equal('notes' in publicCustomer(state.customers[0]),false);assert.equal('tags' in publicCustomer(state.customers[0]),false);assert.equal(publicOrder(order).internalNote,'')});
test('persistent transaction locking prevents overselling under concurrent requests',async()=>{await mutateStore(state=>{const fresh=fixture();fresh.products.find(p=>p.id==='velvet')!.stock=1;Object.assign(state,fresh)});const results=await Promise.allSettled([mutateStore(state=>createOrder(state,state.customers[0],payload('concurrent-order-a'))),mutateStore(state=>createOrder(state,state.customers[0],payload('concurrent-order-b')))]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const state=await readStore();assert.equal(state.orders.length,1);assert.equal(state.products.find(p=>p.id==='velvet')!.stock,0)});
test('persistent request limits stop further attempts in the configured window',async()=>{await mutateStore(state=>limit(state,'test-limit',1,60000));await assert.rejects(()=>mutateStore(state=>limit(state,'test-limit',1,60000)));assert.equal((await readStore()).limits['test-limit'].count,1)});
test('development SMS cannot be enabled by a production process',()=>{const previous={NODE_ENV:process.env.NODE_ENV,VELORA_SMS_MODE:process.env.VELORA_SMS_MODE,TWILIO_ACCOUNT_SID:process.env.TWILIO_ACCOUNT_SID};Object.assign(process.env,{NODE_ENV:'production',VELORA_SMS_MODE:'development'});delete process.env.TWILIO_ACCOUNT_SID;assert.equal(smsMode(),'unconfigured');for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}});

test('prices and quantities reject ambiguous types and fractional paise',()=>{assert.equal(moneyValue('1499.95','price'),1499.95);assert.equal(moneyValue(0.29,'price'),0.29);for(const value of [true,false,[],{},' '])assert.throws(()=>numberValue(value,'quantity'));assert.throws(()=>moneyValue(499.999,'price'));assert.throws(()=>validateAddress({...address,postalCode:'5000017'}));assert.throws(()=>validateAddress({...address,postalCode:500001}))});
test('portal origin checks accept the canonical address and reject aliases and unrelated origins',async()=>{await smsEnvironment({NODE_ENV:'development',VELORA_APP_SURFACE:'admin',VELORA_ADMIN_URL:'http://127.0.0.1:3002',VELORA_STOREFRONT_URL:'http://localhost:3001'},()=>{const request=(origin:string)=>new Request('http://127.0.0.1:3002/api/auth/admin/login',{headers:{Origin:origin}});assert.doesNotThrow(()=>checkOrigin(request('http://127.0.0.1:3002')));for(const origin of ['http://localhost:3002','http://localhost:3001','http://127.0.0.1:4000','https://untrusted.example'])assert.throws(()=>checkOrigin(request(origin)))});await smsEnvironment({NODE_ENV:'production',VELORA_APP_SURFACE:'admin',VELORA_ADMIN_URL:'https://admin.velora.example',VELORA_STOREFRONT_URL:'https://velora.example'},()=>{assert.doesNotThrow(()=>checkOrigin(new Request('https://admin.velora.example/api/auth/admin/login',{headers:{Origin:'https://admin.velora.example'}})));assert.throws(()=>checkOrigin(new Request('https://admin.velora.example/api/auth/admin/login',{headers:{Origin:'https://velora.example'}})))})});
test('customer login return links stay on public storefront routes',()=>{assert.equal(safeAccountReturnTo('/checkout'),'/checkout');assert.equal(safeAccountReturnTo('/shop?sort=low'),'/shop?sort=low');for(const target of ['//evil.example','/\t/evil.example','/admin','/%61dmin/login','/api','/api/auth/session','/account?returnTo=/checkout'])assert.equal(safeAccountReturnTo(target),'/account')});

test('decimal order lines and totals remain precise to the paise',()=>{const state=fixture(),product=state.products.find(item=>item.id==='velvet')!;product.stock=3;product.price=99.99;state.settings.shippingFee=5.5;state.settings.taxRate=18;const order=createOrder(state,state.customers[0],{...payload('decimal-checkout'),items:[{productId:product.id,size:50,quantity:3}]});assert.equal(order.items[0].total,299.97);assert.equal(order.subtotal,299.97);assert.equal(order.tax,53.99);assert.equal(order.total,359.46)});

test('authentication validates the requested host and port rather than an internal/default URL',async()=>{await smsEnvironment({NODE_ENV:'development',VELORA_APP_SURFACE:'storefront',VELORA_STOREFRONT_URL:'http://localhost:3001',VELORA_ADMIN_URL:'http://127.0.0.1:3002',APP_URL:'http://localhost:3000'},()=>{const request=(origin:string,host='localhost:3001',site='same-origin')=>new Request('http://localhost:3000/api/account',{headers:{Host:host,Origin:origin,'Sec-Fetch-Site':site}});assert.doesNotThrow(()=>checkOrigin(request('http://localhost:3001')));for(const origin of ['http://127.0.0.1:3001','http://localhost:3000','http://localhost:3002','https://untrusted.example','null'])assert.throws(()=>checkOrigin(request(origin)));assert.throws(()=>checkOrigin(request('http://localhost:3001','localhost:3001','cross-site')));assert.throws(()=>checkOrigin(request('http://localhost:3001','untrusted.example@localhost:3001')));assert.throws(()=>checkOrigin(request('https://untrusted.example','localhost:3001')))})});

async function smsEnvironment<T>(settings:Record<string,string|undefined>,run:()=>Promise<T>|T){
 const previous=Object.fromEntries(Object.keys(settings).map(key=>[key,process.env[key]]));
 try{for(const [key,value] of Object.entries(settings)){if(value===undefined)Reflect.deleteProperty(process.env,key);else process.env[key]=value}return await run()}finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)Reflect.deleteProperty(process.env,key);else process.env[key]=value}}
}
const fakeSmsSettings={NODE_ENV:'development',VERCEL:undefined,VELORA_SMS_MODE:'twilio',VELORA_SMS_SCOPE:'localhost',OTP_TEST_NUMBERS:'+919000000001',TWILIO_ACCOUNT_SID:'AC'+'a'.repeat(32),TWILIO_AUTH_TOKEN:'b'.repeat(32),TWILIO_VERIFY_SERVICE_SID:'VA'+'c'.repeat(32)};
test('real SMS requires explicit configuration and development mode never sends real messages',()=>smsEnvironment(fakeSmsSettings,async()=>{
 assert.equal(smsMode(),'twilio');
 await smsEnvironment({VELORA_SMS_MODE:'development'},()=>assert.equal(smsMode(),'development'));
 await smsEnvironment({TWILIO_AUTH_TOKEN:undefined},()=>assert.equal(smsMode(),'unconfigured'));
}));
test('localhost-only SMS blocks hosted origins, production and unlisted recipients',()=>smsEnvironment(fakeSmsSettings,async()=>{
 const local=new Request('http://localhost:3001/api/auth/otp/request',{headers:{Origin:'http://localhost:3001'}});
 assert.doesNotThrow(()=>assertSmsRequestAllowed(local,'+919000000001'));
 assert.throws(()=>assertSmsRequestAllowed(local,'+919000000002'));
 assert.throws(()=>assertSmsRequestAllowed(new Request('https://velora.example/api/auth/otp/request'),'+919000000001'));
 assert.throws(()=>assertSmsRequestAllowed(new Request('http://localhost:3001/api/auth/otp/request',{headers:{Origin:'https://velora.example'}})));
 await smsEnvironment({NODE_ENV:'production'},()=>assert.throws(()=>assertSmsRequestAllowed(local)));
 await smsEnvironment({VERCEL:'1'},()=>assert.throws(()=>assertSmsRequestAllowed(local)));
}));
test('Twilio connection, SMS send and verification use the provider API without exposing credentials',()=>smsEnvironment(fakeSmsSettings,async()=>{
 const calls:{url:string;init:RequestInit|undefined}[]=[];
 const provider=mock.method(globalThis,'fetch',async(input:string|URL|Request,init?:RequestInit)=>{const url=String(input);calls.push({url,init});return new Response(JSON.stringify(url.endsWith('/Verifications')?{status:'pending'}:url.endsWith('/VerificationCheck')?{status:'approved'}:{friendly_name:'Local Verify',code_length:6}),{status:200,headers:{'Content-Type':'application/json'}})});
 try{
  const checked=await checkSmsConnection(new Request('http://localhost:3001/api/admin/integrations/sms'));
  assert.equal(checked.connected,true);assert.equal(checked.scope,'localhost');assert.equal('authToken' in checked,false);
  assert.equal((await twilioRequest('Verifications',{To:'+919000000001',Channel:'sms'})).status,'pending');
  assert.equal((await twilioRequest('VerificationCheck',{To:'+919000000001',Code:'123456'})).status,'approved');
  assert.equal(calls.length,3);assert.equal(calls[0].init?.method,'GET');assert.equal(calls[1].init?.method,'POST');
  assert.ok(calls.every(call=>call.url.startsWith('https://verify.twilio.com/v2/Services/VA')));
  await assert.rejects(()=>checkSmsConnection(new Request('https://velora.example/api/admin/integrations/sms')));
  assert.equal(calls.length,3,'A hosted request never reaches the SMS provider');
 }finally{provider.mock.restore()}
}));
test('inventory updates reject stale stock and validate the whole batch before writing',()=>{
 const state=fixture(),first=state.products.find(product=>product.id==='noir')!,second=state.products.find(product=>product.id==='velvet')!;
 assert.throws(()=>updateInventory(state,[{id:first.id,stock:8,expectedStock:0},{id:second.id,stock:8,expectedStock:99}]));assert.equal(first.stock,0);assert.equal(second.stock,2);
 const changed=updateInventory(state,[{id:first.id,stock:8,expectedStock:0},{id:second.id,stock:9,expectedStock:2}]);assert.equal(changed.length,2);assert.equal(first.stock,8);assert.equal(second.stock,9);
 assert.throws(()=>updateInventory(state,[{id:first.id,stock:5,expectedStock:8},{id:first.id,stock:6,expectedStock:8}]));assert.equal(first.stock,8);
});


test('CSV parsing handles spreadsheet escapes, quoted newlines, commas and Unicode',()=>{
 const rows=[['name','phone','notes'],['Bloom, extrait','+919876543210','Rose\nJasmine "petals"'],['=1+1','+441234567890','Éclat']];
 const csv=toCsv(rows),parsed=parseCsv(csv);assert.equal(parsed[0].name,'Bloom, extrait');assert.equal(parsed[0].phone,'+919876543210');assert.equal(parsed[0].notes,'Rose\nJasmine "petals"');assert.equal(parsed[1].name,'=1+1');assert.equal(parsed[1].notes,'Éclat');assert.ok(csv.includes("'=1+1"));
});
test('CSV parsing rejects malformed, duplicate, oversized and inconsistent records',()=>{
 for(const csv of ['name,name\na,b','name\n"unfinished','name,phone\nOnly one','name\n"quoted"invalid','name\n'])assert.throws(()=>parseCsv(csv));
 assert.throws(()=>parseCsv('name\n'+'a\n'.repeat(101)));assert.throws(()=>parseCsv('name\n'+'a'.repeat(500001)));
});
test('dashboard reports apply dates, statuses, product and regional filters to actual orders',()=>{
 const state=fixture(),order=createOrder(state,state.customers[0],payload()),anchor=new Date('2026-11-04T12:00:00Z');order.createdAt=anchor.toISOString();order.paymentStatus='paid';order.status='delivered';
 const report=createReport(state,{...defaultReportFilters,days:7},anchor);assert.equal(report.orders.length,1);assert.equal(report.revenue,6499);assert.equal(report.points.length,7);assert.equal(report.points.reduce((sum,point)=>sum+point.total,0),6499);assert.equal(report.top[0].quantity,1);
 assert.equal(createReport(state,{...defaultReportFilters,status:'cancelled'},anchor).orders.length,0);assert.equal(createReport(state,{...defaultReportFilters,region:'Kerala'},anchor).orders.length,0);assert.equal(createReport(state,{...defaultReportFilters,product:'not-a-product'},anchor).orders.length,0);
 order.status='cancelled';assert.equal(createReport(state,defaultReportFilters,anchor).top.length,0,'Cancelled orders never inflate bestseller quantities');
});


test('administrator usernames normalize case and reject malformed values',()=>{
 assert.equal(usernameValue('  Store.Admin  '),'store.admin');
 for(const value of ['', 'ab','123admin','admin@example.test','admin with spaces','a'.repeat(41)])assert.throws(()=>usernameValue(value));
});
test('short local passwords require the explicit operator exception',async()=>{
 await assert.rejects(()=>hashPassword('Local123'));
 const hash=await hashPassword('Local123',{minimumLength:8});assert.equal(await verifyPassword('Local123',hash),true);assert.equal(await verifyPassword('Incorrect123',hash),false);
 await assert.rejects(()=>hashPassword('1234567',{minimumLength:8}));
});


test('account reviews require the customer’s delivered purchase and remain customer-owned',()=>{
 const state=fixture(),user=state.customers[0],order=createOrder(state,user,payload());
 const data={productId:'velvet',rating:5,title:'A beautiful fragrance',body:'A warm and lasting fragrance that I enjoyed.'};
 assert.throws(()=>saveAccountReview(state,user,'POST',data,''));assert.equal(Boolean(user.reviews),false);
 order.status='delivered';saveAccountReview(state,user,'POST',data,'');assert.equal(user.reviews?.length,1);const review=user.reviews![0];
 assert.throws(()=>saveAccountReview(state,user,'POST',data,''));
 const other={...customer(),id:'other',reviews:[]};state.customers.push(other);assert.throws(()=>saveAccountReview(state,other,'PATCH',data,review.id));assert.throws(()=>saveAccountReview(state,other,'DELETE',{},review.id));
 saveAccountReview(state,user,'PATCH',{...data,rating:4,title:'Updated impression'},review.id);assert.equal(user.reviews![0].rating,4);assert.equal(user.reviews![0].createdAt,review.createdAt);
 assert.throws(()=>saveAccountReview(state,user,'PATCH',{...data,rating:9},review.id));assert.equal(user.reviews![0].rating,4);
 saveAccountReview(state,user,'DELETE',{},review.id);assert.equal(user.reviews?.length,0);
});
