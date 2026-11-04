/* eslint-disable @typescript-eslint/no-explicit-any -- Integration tests inspect endpoint payloads and DOM measurements. */
import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {cp,mkdir,mkdtemp,rm,symlink} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {chromium} from '@playwright/test';
async function main(){
 const project=process.cwd(),directory=await mkdtemp(path.join(os.tmpdir(),'velora-offer-')),fixture=path.join(directory,'app');
 const store='http://localhost:3241',admin='http://127.0.0.1:3242',password=randomBytes(24).toString('base64url'),phone='+919000000051';
 const environment:NodeJS.ProcessEnv={...process.env,NODE_ENV:'development',DATABASE_URL:'',VELORA_DATA_DIR:path.join(directory,'data'),VELORA_STOREFRONT_URL:store,VELORA_ADMIN_URL:admin,VELORA_SMS_MODE:'development',VELORA_SMS_SCOPE:'localhost',OTP_TEST_NUMBERS:'',OTP_ALLOWED_COUNTRY_CODES:'+91',NEXT_TELEMETRY_DISABLED:'1',VELORA_DEV_DIST:'',TWILIO_ACCOUNT_SID:'',TWILIO_AUTH_TOKEN:'',TWILIO_VERIFY_SERVICE_SID:''};
 const children:ChildProcess[]=[];let storeOutput='';
 const wait=async(check:()=>boolean|Promise<boolean>)=>{const until=Date.now()+90000;while(Date.now()<until){if(await check())return;await new Promise(resolve=>setTimeout(resolve,100))}throw new Error('Timed out waiting for offer fixture.')};
 try{
  await mkdir(fixture);for(const entry of ['app','components','lib','scripts','tests','middleware.ts','next.config.ts','tsconfig.json','postcss.config.mjs','eslint.config.mjs','package.json','next-env.d.ts'])await cp(path.join(project,entry),path.join(fixture,entry),{recursive:true});
  for(const entry of ['node_modules','public'])await symlink(path.join(project,entry),path.join(fixture,entry));
  const setup=spawn(process.execPath,['--import','tsx','scripts/admin-create.ts','--stdin'],{cwd:fixture,env:environment,stdio:['pipe','ignore','pipe']});let setupError='';setup.stderr.on('data',chunk=>setupError+=chunk);setup.stdin.end(JSON.stringify({email:'offer@example.test',username:'offer-owner',name:'Offer Owner',password}));await new Promise<void>((resolve,reject)=>setup.on('exit',code=>code===0?resolve():reject(new Error(setupError))));
  for(const surface of ['storefront','admin']){const child=spawn(process.execPath,['scripts/dev.mjs','--surface',surface],{cwd:fixture,env:environment,stdio:['ignore','pipe','pipe'],detached:true});children.push(child);child.stdout?.on('data',chunk=>{if(surface==='storefront')storeOutput=(storeOutput+chunk).slice(-200000)});child.stderr?.on('data',()=>{})}
  await Promise.all([store,admin].map(origin=>wait(async()=>{try{return(await fetch(origin+'/api/catalog')).ok}catch{return false}})));
  const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
  try{
   const context=await browser.newContext(),page=await context.newPage();
   const api=async(origin:string,url:string,method='GET',data?:unknown,status=200)=>{const response=await context.request.fetch(origin+url,{method,headers:{Origin:origin},...(data===undefined?{}:{data})});assert.equal(response.status(),status,method+' '+url+' '+await response.text());return response.headers()['content-type']?.includes('json')?response.json():response.text()};
   await api(admin,'/api/auth/admin/login','POST',{identifier:'offer-owner',password});
   await api(admin,'/api/admin/settings','PATCH',{codEnabled:true,shippingFee:90,taxRate:5,festivalOfferProductIds:['velvet'],festivalOfferPercent:25,festivalOfferEnabled:true,festivalOfferFreeShipping:true});
   for(const id of ['velvet','flora'])await api(admin,'/api/admin/products/'+id,'PATCH',{stock:5});
   await page.setViewportSize({width:1555,height:1012});await page.goto(store);await page.getByRole('dialog',{name:'Diwali Special Exclusive Offer'}).waitFor();
   await page.locator('.diwali-art img').evaluate((image:any)=>image.decode());await page.screenshot({path:'/private/tmp/velora-diwali-desktop.png'});
   const checkDialog=async()=>{const geometry=await page.locator('.diwali-dialog').evaluate(node=>({width:node.scrollWidth,client:node.clientWidth,screen:window.innerWidth,right:node.getBoundingClientRect().right}));assert.ok(geometry.width<=geometry.client+2,'Offer popup must not overflow internally');assert.ok(geometry.right<=geometry.screen+1,'Offer popup fits the viewport')};
   for(const width of [1920,1440,1024,820,768,700,390,320]){await page.setViewportSize({width,height:844});await checkDialog()}
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/private/tmp/velora-diwali-mobile.png'});
   await page.keyboard.press('Escape');await page.locator('.diwali-dialog').waitFor({state:'hidden'});await wait(async()=>await page.locator('.product-world').getAttribute('inert')===null);assert.equal(await page.locator('.diwali-form input').count(),0,'Closed offer inputs do not collide with other forms');
   await page.getByRole('button',{name:'Diwali special',exact:true}).click();await page.getByLabel('Full name',{exact:true}).fill('Diwali Test Customer');await page.getByLabel('Mobile number',{exact:true}).fill('9000000051');await page.getByLabel('Email address (optional)',{exact:true}).fill('diwali@example.test');
   const claimed=page.waitForResponse(response=>response.url().endsWith('/api/offers/claim'));await page.getByRole('button',{name:'Claim my Diwali offer',exact:true}).click();assert.equal((await claimed).status(),200);await page.getByText('Your festival offer is unlocked.',{exact:false}).waitFor();
   await page.screenshot({path:'/private/tmp/velora-diwali-unlocked-mobile.png'});
   assert.equal((await api(store,'/api/auth/session')).user,null,'Claiming is not authentication');await api(store,'/api/account','GET',undefined,401);
   const bootstrap=await api(admin,'/api/admin/bootstrap'),lead=bootstrap.leads.find((lead:any)=>lead.phone===phone);assert.equal(lead.name,'Diwali Test Customer');assert.equal(lead.email,'diwali@example.test');assert.equal(lead.marketingConsent,false);assert.equal(lead.status,'new');assert.equal(bootstrap.customers.length,0);
   assert.equal((await context.request.get(store+'/api/admin/leads')).status(),404);
   assert.equal((await context.request.post(admin+'/api/offers/claim',{data:{name:'Wrong server',phone}})).status(),404);
   await page.getByRole('link',{name:'Shop my Diwali offers',exact:true}).click();await page.locator('.festival-product-ribbon').waitFor();
   const catalog=await api(store,'/api/catalog'),bloom=catalog.products.find((product:any)=>product.id==='velvet');assert.equal(bloom.offer.percent,25);assert.equal(catalog.products.find((product:any)=>product.id==='flora').offer,undefined);
   await page.getByRole('button',{name:'Diwali offers',exact:true}).click();assert.equal(await page.locator('.glass-product-card').count(),1);
   await page.getByRole('link',{name:'Discover Bloom',exact:true}).click();await page.getByRole('heading',{name:'Bloom',exact:true}).waitFor();assert.ok((await page.locator('.detail-price').innerText()).includes('4,874.25'));
   await page.getByRole('radio',{name:'100 ml',exact:false}).check();assert.ok((await page.locator('.detail-price').innerText()).includes('7,798.5'));
   const outsider=await browser.newContext();const duplicate=await outsider.request.post(store+'/api/offers/claim',{headers:{Origin:store},data:{name:'Changed by stranger',phone,email:'stranger@example.test',marketingConsent:true}});assert.equal(duplicate.status(),200);await outsider.close();assert.equal((await api(admin,'/api/admin/bootstrap')).leads.find((item:any)=>item.id===lead.id).name,'Diwali Test Customer','An anonymous repeat claim cannot overwrite an existing enquiry');
   await api(store,'/api/offers/claim','POST',{name:'Missing phone'},400);
   const cross=await context.request.post(store+'/api/offers/claim',{headers:{Origin:admin},data:{name:'Cross origin',phone}});assert.equal(cross.status(),403);
   const otp=await api(store,'/api/auth/otp/request','POST',{phone});await wait(()=>storeOutput.includes('[Velora local OTP] '+phone+':'));const code=[...storeOutput.matchAll(/\[Velora local OTP\] \+919000000051: ([0-9]{6})/g)].at(-1)?.[1];assert.ok(code);await api(store,'/api/auth/otp/verify','POST',{challengeId:otp.challengeId,code});
   const orderPayload={idempotencyKey:'offer-browser-order',items:[{productId:'velvet',size:50,quantity:1},{productId:'flora',size:50,quantity:1}],address:{name:'Diwali Test Customer',phone,line1:'123 Diwali Test Street',city:'Hyderabad',state:'Telangana',postalCode:'500001',country:'India'},expectedTotal:10891.91,unitPrice:1,discount:99};
   const order=await api(store,'/api/account/orders','POST',orderPayload,201);assert.equal(order.order.total,10891.91);assert.equal(order.order.offer.discount,1624.75);assert.equal(order.order.shipping,0);assert.equal(order.order.items[1].unitPrice,5499);
   const converted=(await api(admin,'/api/admin/bootstrap')).leads.find((item:any)=>item.id===lead.id);assert.equal(converted.status,'converted');assert.ok(converted.customerId);
   await page.setViewportSize({width:1440,height:1000});await page.goto(admin+'/admin');await page.getByRole('navigation',{name:'Administration navigation'}).getByRole('button',{name:'Offer leads',exact:true}).click();await page.getByRole('heading',{name:'Offer leads',exact:true}).waitFor();await page.screenshot({path:'/private/tmp/velora-offer-leads-desktop.png'});await page.setViewportSize({width:320,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'320px offer leads page');await page.screenshot({path:'/private/tmp/velora-offer-leads-mobile.png'});await page.setViewportSize({width:1440,height:1000});
   await page.getByRole('button',{name:'Diwali Test Customer',exact:true}).click();await page.getByLabel('Private follow-up notes',{exact:true}).fill('Fixture follow-up completed.');const saved=page.waitForResponse(response=>response.url().endsWith('/api/admin/leads/'+lead.id)&&response.request().method()==='PATCH');await page.getByRole('button',{name:'Save enquiry',exact:true}).click();assert.equal((await saved).status(),200);
   await page.getByRole('navigation',{name:'Administration navigation'}).getByRole('button',{name:'Store settings',exact:true}).click();await page.getByLabel('Filter settings section',{exact:true}).selectOption('offers');await page.getByRole('heading',{name:'Festival offer',exact:true}).waitFor();await page.getByLabel('Festival discount (%)',{exact:true}).fill('20');const settingsSaved=page.waitForResponse(response=>response.url().endsWith('/api/admin/settings')&&response.request().method()==='PATCH');await page.getByRole('button',{name:'Save store settings',exact:true}).click();assert.equal((await settingsSaved).status(),200);assert.equal((await api(store,'/api/catalog')).offer.percent,20);
   const csv=await api(admin,'/api/admin/export?resource=leads');assert.ok(csv.includes('diwali@example.test'));assert.ok(csv.includes('Fixture follow-up completed.'));
   await api(admin,'/api/admin/leads/'+lead.id,'PATCH',{status:'archived'});assert.equal((await api(store,'/api/catalog')).offer.unlocked,false);
   await api(store,'/api/account/orders','POST',{...orderPayload,idempotencyKey:'expired-offer-total'},409);
   await api(admin,'/api/admin/leads/'+lead.id,'DELETE');assert.equal((await api(admin,'/api/admin/bootstrap')).leads.length,0);assert.equal((await api(store,'/api/account')).orders.length,1,'Deleting an enquiry preserves customer orders');
   for(const width of [1440,1024,820,768,390,320]){await page.setViewportSize({width,height:900});await page.goto(store+'/shop');await page.getByRole('heading',{name:'Find your signature.',exact:false}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),width+'px storefront after typography increase')}
   await context.close();console.info('Offer checks passed: responsive popup and dismissal, claim validation, private CRM capture/consent, ribbons and variant pricing, anonymous record protection, same-origin checks, matching-phone OTP checkout, server discounts/tax/delivery, CRM follow-up/export, admin campaign controls, archival and deletion.');
  }finally{await browser.close()}
 }finally{for(const child of children)if(child.pid)try{process.kill(-child.pid,'SIGTERM')}catch{};await new Promise(resolve=>setTimeout(resolve,1000));for(const child of children)if(child.pid)try{process.kill(-child.pid,'SIGKILL')}catch{};await rm(directory,{recursive:true,force:true})}
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1});
