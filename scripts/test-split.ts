import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {cp,mkdir,mkdtemp,rm,symlink} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {chromium} from '@playwright/test';

async function main(){
 const project=process.cwd(),directory=await mkdtemp(path.join(os.tmpdir(),'velora-split-')),fixture=path.join(directory,'app');
 const store='http://localhost:3221',admin='http://127.0.0.1:3222',password=randomBytes(24).toString('base64url');
 const environment:NodeJS.ProcessEnv={...process.env,NODE_ENV:'development',DATABASE_URL:'',VELORA_DATA_DIR:path.join(directory,'data'),VELORA_STOREFRONT_URL:store,VELORA_ADMIN_URL:admin,VELORA_SMS_MODE:'development',VELORA_SMS_SCOPE:'localhost',OTP_TEST_NUMBERS:'',OTP_ALLOWED_COUNTRY_CODES:'+91',NEXT_TELEMETRY_DISABLED:'1',VELORA_DEV_DIST:''};
 const children:ChildProcess[]=[];let storeOutput='';
 const stop=async()=>{for(const child of children)if(child.pid)try{process.kill(-child.pid,'SIGTERM')}catch{};await new Promise(resolve=>setTimeout(resolve,1000));for(const child of children)if(child.pid)try{process.kill(-child.pid,'SIGKILL')}catch{}};
 try{
  await mkdir(fixture);
  for(const entry of ['app','components','lib','scripts','tests','middleware.ts','next.config.ts','tsconfig.json','postcss.config.mjs','eslint.config.mjs','package.json','next-env.d.ts'])await cp(path.join(project,entry),path.join(fixture,entry),{recursive:true});
  for(const entry of ['node_modules','public'])await symlink(path.join(project,entry),path.join(fixture,entry));
  const setup=spawn(process.execPath,['--import','tsx','scripts/admin-create.ts','--stdin'],{cwd:fixture,env:environment,stdio:['pipe','ignore','pipe']});let setupError='';setup.stderr.on('data',chunk=>setupError+=chunk);setup.stdin.end(JSON.stringify({email:'split@example.test',username:'split-owner',name:'Split Owner',password}));
  await new Promise<void>((resolve,reject)=>setup.on('exit',code=>code===0?resolve():reject(new Error('Fixture setup failed: '+setupError))));
  for(const surface of ['storefront','admin']){
   const child=spawn(process.execPath,['scripts/dev.mjs','--surface',surface],{cwd:fixture,env:environment,stdio:['ignore','pipe','pipe'],detached:true});children.push(child);
   let errors='';child.stderr?.on('data',chunk=>errors=(errors+chunk).slice(-3000));child.on('exit',code=>{if(code)console.error(`Fixture ${surface} exited with ${code}: ${errors}`)});
   child.stdout?.on('data',chunk=>{if(surface==='storefront')storeOutput=(storeOutput+chunk).slice(-200000)});
  }
  const waitFor=async(check:()=>boolean|Promise<boolean>)=>{const until=Date.now()+90000;while(Date.now()<until){if(await check())return;await new Promise(resolve=>setTimeout(resolve,150))}throw new Error('Timed out waiting for split-server fixture.')};
  await Promise.all([store,admin].map(origin=>waitFor(async()=>{try{return(await fetch(origin+'/api/catalog')).ok}catch{return false}})));
  const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
  try{
   const context=await browser.newContext(),page=await context.newPage();
   page.setDefaultNavigationTimeout(90000);
   const screenshots=path.join(os.tmpdir(),'velora-login-review');await mkdir(screenshots,{recursive:true});
   const checkLoginLayout=async(label:string)=>{
    await page.locator('.brand-logo img').first().evaluate((image:HTMLImageElement)=>image.decode());
    for(const viewport of [{width:1920,height:1080},{width:1440,height:900},{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
     await page.setViewportSize(viewport);
     const layout=await page.evaluate(()=>{
      const card=document.querySelector('.velora-auth-card')!.getBoundingClientRect();
      return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,left:card.left,right:card.right,top:card.top,clipped:[...document.querySelectorAll('.velora-auth-form input,.velora-auth-form button')].filter(element=>{const box=element.getBoundingClientRect();return box.width>0&&(box.left<0||box.right>innerWidth)}).length};
     });
     assert.ok(layout.documentWidth<=layout.width+1&&layout.left>=0&&layout.right<=layout.width+1&&layout.top>=0&&!layout.clipped,`${label} fits ${viewport.width}×${viewport.height}`);
     if([1920,390,320].includes(viewport.width))await page.screenshot({path:path.join(screenshots,`${label}-${viewport.width}.png`),fullPage:true});
    }
    await page.setViewportSize({width:1440,height:900});
   };
   for(const route of ['/admin','/admin/login','/api/admin/bootstrap','/api/admin/export','/api/auth/admin/login'])assert.equal((await context.request.get(store+route)).status(),404,route+' is unavailable on storefront');
   for(const route of ['/shop','/account','/checkout','/api/account','/api/auth/otp/request','/api/auth/logout'])assert.equal((await context.request.get(admin+route)).status(),404,route+' is unavailable on admin');
   assert.equal((await context.request.post(store+'/api/auth/admin/login',{data:{identifier:'split-owner',password}})).status(),404);
   assert.equal((await context.request.post(admin+'/api/auth/otp/request',{data:{phone:'+919000000031'}})).status(),404);
   assert.equal((await context.request.get(admin+'/api/admin/bootstrap')).status(),401);
   const alias=await context.request.get('http://localhost:3222/admin/login',{maxRedirects:0});assert.equal(alias.status(),421);
   assert.equal((await context.request.post('http://localhost:3222/api/auth/admin/login',{data:{identifier:'split-owner',password}})).status(),421);
   const denied=await context.request.get(store+'/api/admin/bootstrap',{headers:{'x-middleware-subrequest':'middleware:middleware:middleware:middleware:middleware'}});assert.equal(denied.status(),404);
   for(const origin of [store,admin]){
    assert.equal((await context.request.get(origin+'/brand/alora-logo-transparent.webp')).status(),200,'Both portals serve the transparent logo');
    assert.equal((await context.request.get(origin+'/_next/image?url=%2Fbrand%2Falora-logo-transparent.webp&w=384&q=75')).status(),200,'Logo optimization works across the portal boundary');
   }
   await page.goto(admin+'/admin/login');await page.getByRole('heading',{name:'Store Administration',exact:true}).waitFor();await checkLoginLayout('admin');
   await page.getByRole('button',{name:'Forgot password?',exact:true}).click();await page.getByRole('heading',{name:'Restore administrator access',exact:true}).waitFor();await checkLoginLayout('admin-recovery');await page.getByRole('button',{name:'Forgot password?',exact:true}).click();
   await page.getByLabel('Username or email',{exact:true}).fill('split-owner');await page.getByLabel('Password',{exact:true}).fill(password);
   await page.getByRole('button',{name:'Show password',exact:true}).click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'text');await page.getByRole('button',{name:'Hide password',exact:true}).click();
   await page.getByRole('button',{name:'Sign In',exact:true}).click();await page.getByRole('navigation',{name:'Administration navigation'}).waitFor();
   assert.equal((await context.request.get(admin+'/api/admin/bootstrap')).status(),200);
   assert.equal((await page.getByRole('link',{name:'ALORA administration',exact:true}).locator('img').evaluate((image:HTMLImageElement)=>image.decode().then(()=>image.naturalWidth>0))),true);
   await page.screenshot({path:path.join(screenshots,'admin-dashboard-branded.png'),fullPage:true});
   const printPage=await context.newPage();await printPage.goto(admin+'/admin/print?resource=products');await printPage.locator('.admin-print-brand .brand-logo img').evaluate((image:HTMLImageElement)=>image.decode());await printPage.screenshot({path:path.join(screenshots,'admin-print-branded.png'),fullPage:true});await printPage.close();
   assert.equal(await page.getByRole('link',{name:'View storefront',exact:true}).getAttribute('href'),store);
   assert.equal((await context.request.patch(admin+'/api/admin/products/velvet',{headers:{Origin:admin},data:{stock:3}})).status(),200);
   assert.equal((await context.request.patch(admin+'/api/admin/settings',{headers:{Origin:admin},data:{codEnabled:true}})).status(),200);
   const catalog=await(await context.request.get(store+'/api/catalog')).json();assert.equal(catalog.products.find((product:{id:string})=>product.id==='velvet').stock,3,'Admin inventory changes appear on the separate storefront');
   const adminCookies=await context.cookies(admin),storeCookies=await context.cookies(store);
   const session=adminCookies.find(cookie=>cookie.name==='velora_admin_portal_session');assert.ok(session?.httpOnly);assert.equal(session?.sameSite,'Strict');assert.equal(storeCookies.some(cookie=>cookie.name.includes('admin')),false);
   const storeSession=await context.request.get(store+'/api/auth/session');assert.equal((await storeSession.json()).admin,null);
   const foreign=await context.request.post(admin+'/api/auth/admin/logout',{headers:{Origin:store}});assert.equal(foreign.status(),403);assert.equal((await context.request.get(admin+'/api/admin/bootstrap')).status(),200);
   const forged=await context.request.post(admin+'/api/admin/settings',{headers:{Origin:store},data:{storeName:'Should never be saved'}});assert.equal(forged.status(),403);
   await page.goto(store+'/');
   await page.getByRole('link',{name:'ALORA home',exact:true}).first().locator('img').evaluate((image:HTMLImageElement)=>image.decode());
   for(const viewport of [{width:1920,height:1080},{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:568}]){
    await page.setViewportSize(viewport);
    const fits=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth,header:[...document.querySelectorAll('.velora-header .brand-logo,.velora-header button')].every(element=>{const r=element.getBoundingClientRect();return r.width===0||(r.left>=0&&r.right<=innerWidth+1)})}));
    assert.ok(fits.content<=fits.width+1&&fits.header,'Branded storefront fits '+viewport.width+'px');
    await page.screenshot({path:path.join(screenshots,`storefront-${viewport.width}.png`),fullPage:false});
   }
   await page.goto(store+'/account');await page.getByLabel('Mobile Number',{exact:true}).waitFor();await checkLoginLayout('customer');
   await page.getByRole('combobox',{name:'Country / region',exact:true}).selectOption('custom');await page.getByLabel('Country calling code',{exact:true}).fill('+49');await checkLoginLayout('customer-country');await page.getByRole('combobox',{name:'Country / region',exact:true}).selectOption('+91');await page.getByLabel('Mobile Number',{exact:true}).fill('9000000031');
   const requested=page.waitForResponse(response=>response.url().endsWith('/api/auth/otp/request'));await page.getByRole('button',{name:'Send OTP',exact:true}).click();assert.equal((await requested).status(),200);
   await waitFor(()=>storeOutput.includes('[ALORA local OTP] +919000000031:'));
   const code=[...storeOutput.matchAll(/\[ALORA local OTP\] \+919000000031: ([0-9]{6})/g)].at(-1)?.[1];assert.ok(code);
   await page.getByLabel('Verification code digit 1 of 6').waitFor();await checkLoginLayout('customer-otp');
   await page.getByLabel('Verification code digit 1 of 6').fill(code);await page.getByRole('button',{name:'Verify & sign in',exact:true}).click();await page.getByRole('heading',{name:'Recent Orders',exact:true}).waitFor();
   assert.equal((await context.request.get(store+'/api/account')).status(),200);
   const orderResponse=await context.request.post(store+'/api/account/orders',{headers:{Origin:store},data:{items:[{productId:'velvet',size:50,quantity:1}],idempotencyKey:'split-server-order',address:{label:'Home',name:'Split Customer',phone:'+919000000031',line1:'123 Split Test Street',line2:'',city:'Hyderabad',state:'Telangana',postalCode:'500001',country:'India',isDefault:true}}});assert.equal(orderResponse.status(),201);
   const createdOrder=await orderResponse.json(),orders=await(await context.request.get(admin+'/api/admin/orders')).json();assert.ok(orders.orders.some((order:{id:string})=>order.id===createdOrder.order.id),'A storefront order appears in the separate admin');
   assert.equal((await context.cookies(admin)).some(cookie=>cookie.name==='velora_customer_session'),false);
   const adminSession=await(await context.request.get(admin+'/api/auth/session')).json();assert.equal(adminSession.user,null);assert.equal(adminSession.admin.username,'split-owner');
   assert.equal((await context.request.post(store+'/api/auth/logout',{headers:{Origin:store}})).status(),200);
   assert.equal((await context.request.get(admin+'/api/admin/bootstrap')).status(),200,'Customer logout preserves the admin session');
   assert.equal((await context.request.post(admin+'/api/auth/admin/logout',{headers:{Origin:admin}})).status(),200);
   assert.equal((await context.request.get(admin+'/api/admin/bootstrap')).status(),401);
   await context.close();console.info('Split-server checks passed: independent ports/hosts, route and API isolation, admin browser login, storefront OTP sign-in, host-only cookies, cross-origin rejection, correct storefront link, shared inventory/orders, independent logout, and middleware bypass defense.');
  }finally{await browser.close()}
 }finally{await stop();await rm(directory,{recursive:true,force:true})}
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1});
