import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appSurface,assertSeparateOrigins,identityAllowed,surfaceAllowsPath} from '../lib/app-surface';
import {checkOrigin,checkSurface} from '../lib/server/security';

function environment(run:()=>void){
 const keys=['NODE_ENV','VELORA_APP_SURFACE','VELORA_INTEGRATION_TEST','VELORA_STOREFRONT_URL','VELORA_ADMIN_URL','APP_URL'] as const;
 const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 Object.assign(process.env,{NODE_ENV:'development',VELORA_APP_SURFACE:'storefront',VELORA_INTEGRATION_TEST:'',VELORA_STOREFRONT_URL:'http://localhost:3221',VELORA_ADMIN_URL:'http://127.0.0.1:3222',APP_URL:'http://localhost:3000'});
 try{run()}finally{for(const key of keys){if(previous[key]===undefined)delete process.env[key];else Object.assign(process.env,{[key]:previous[key]})}}
}
test('storefront and admin enforce separate route and identity surfaces',()=>environment(()=>{
 assert.equal(appSurface(),'storefront');
 for(const path of ['/','/shop','/account','/checkout','/api/account/orders','/api/auth/otp/request'])assert.equal(surfaceAllowsPath(path,'storefront'),true);
 for(const path of ['/admin','/admin/login','/api/admin/bootstrap','/api/admin/export','/api/auth/admin/login','/api/auth/admin/logout'])assert.equal(surfaceAllowsPath(path,'storefront'),false);
 for(const path of ['/shop','/account','/checkout','/api/account','/api/auth/otp/request','/api/auth/otp/verify','/api/auth/logout'])assert.equal(surfaceAllowsPath(path,'admin'),false);
 for(const path of ['/admin/login','/api/admin/bootstrap','/api/auth/admin/password','/api/auth/session','/api/catalog','/api/media/image','/_next/static/chunk.js','/images/velora-noir.webp'])assert.equal(surfaceAllowsPath(path,'admin'),true);
 assert.equal(identityAllowed('admin','storefront'),false);assert.equal(identityAllowed('customer','admin'),false);
 assert.equal(identityAllowed('admin','admin'),true);assert.equal(identityAllowed('customer','storefront'),true);
 delete process.env.VELORA_APP_SURFACE;assert.equal(appSurface(),'storefront');
 process.env.VELORA_APP_SURFACE='combined';assert.throws(appSurface);
 process.env.VELORA_INTEGRATION_TEST='true';assert.equal(appSurface(),'combined');
 Object.assign(process.env,{NODE_ENV:'production'});assert.throws(appSurface);
}));
test('separate ports on the same hostname are rejected because cookies ignore ports',()=>environment(()=>{
 assert.doesNotThrow(assertSeparateOrigins);
 process.env.VELORA_ADMIN_URL='http://localhost:3222';assert.throws(assertSeparateOrigins);
 process.env.VELORA_ADMIN_URL='https://admin.example.test';process.env.VELORA_STOREFRONT_URL='https://store.example.test';Object.assign(process.env,{NODE_ENV:'production'});assert.doesNotThrow(assertSeparateOrigins);
 delete process.env.VELORA_ADMIN_URL;assert.throws(assertSeparateOrigins);
}));
test('API defense rejects the wrong server and cross-origin mutations even without middleware',()=>environment(()=>{
 const request=(url:string,origin:string,host?:string)=>new Request(url,{method:'POST',headers:{Origin:origin,...(host?{Host:host}:{})}});
 assert.doesNotThrow(()=>checkOrigin(request('http://localhost:3221/api/auth/otp/request','http://localhost:3221')));
 assert.throws(()=>checkSurface(request('http://localhost:3221/api/auth/admin/login','http://localhost:3221')));
 assert.throws(()=>checkOrigin(request('http://localhost:3221/api/account','http://127.0.0.1:3222')));
 assert.throws(()=>checkOrigin(request('http://localhost:3221/api/account','http://localhost:3000')));
 process.env.VELORA_APP_SURFACE='admin';
 assert.doesNotThrow(()=>checkOrigin(request('http://127.0.0.1:3222/api/auth/admin/login','http://127.0.0.1:3222')));
 assert.throws(()=>checkOrigin(request('http://127.0.0.1:3222/api/auth/admin/login','http://localhost:3221')));
 assert.throws(()=>checkOrigin(request('http://127.0.0.1:3222/api/auth/admin/login','http://localhost:3222','localhost:3222')));
 assert.throws(()=>checkSurface(request('http://127.0.0.1:3222/api/account/orders','http://127.0.0.1:3222')));
}));
