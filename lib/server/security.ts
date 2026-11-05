import {createHash,randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import type {AdminRole,AdminUser,Customer,PublicAdmin,PublicCustomer} from '../commerce-types';
import {localStorageAllowed,mutateStore,readStore,type StoreState} from './store';
import {appSurface,assertSeparateOrigins,identityAllowed,surfaceAllowsPath,surfaceOrigin} from '../app-surface';
const scrypt=promisify(scryptCallback);
export class ApiError extends Error {constructor(message:string,public status=400,public retryAfter?:number){super(message)}}
export function checkSurface(request:Request){
 const surface=appSurface();
 if(surface==='combined')return;
 assertSeparateOrigins();
 const canonical=surfaceOrigin(surface),url=new URL(request.url),host=request.headers.get('host')||url.host;
 if(host.toLowerCase()!==canonical.host.toLowerCase())throw new ApiError('Use the configured address for this application.',421);
 if(!surfaceAllowsPath(url.pathname,surface))throw new ApiError('Not found.',404);
}
export function json(value:unknown,status=200){return NextResponse.json(value,{status,headers:{'Cache-Control':'no-store'}})}
export function apiError(error:unknown){if(error instanceof ApiError){const response=json({error:error.message,...(error.retryAfter?{retryAfter:error.retryAfter}:{})},error.status);if(error.retryAfter)response.headers.set('Retry-After',String(error.retryAfter));return response}console.error('[ALORA API]',error instanceof Error?error.message:'Unexpected server error');return json({error:process.env.DATABASE_URL||localStorageAllowed()?'The request could not be completed. Please try again.':'The store is not connected yet. Configure persistent storage to continue.'},503)}
export function checkOrigin(request:Request){
 const surface=appSurface();
 if(surface!=='combined'){
  checkSurface(request);
  if(request.headers.get('sec-fetch-site')==='cross-site')throw new ApiError('This request is not allowed.',403);
  const origin=request.headers.get('origin');
  if(origin&&origin!==surfaceOrigin(surface).origin)throw new ApiError('This request is not allowed.',403);
  return;
 }
 const origin=request.headers.get('origin');
 if(request.headers.get('sec-fetch-site')==='cross-site')throw new ApiError('This request is not allowed.',403);
 if(!origin)return;
 const requestUrl=new URL(request.url),host=request.headers.get('host');
 // Next can reconstruct an internal URL with the configured/default port.
 // The HTTP Host is the address the browser actually requested, including its
 // port. Never infer the browser's origin from arbitrary forwarded headers.
 let target=requestUrl;
 if(host){
  if(!/^(?:[a-z0-9.-]+|\[[a-f0-9:]+\])(?::[0-9]{1,5})?$/i.test(host))throw new ApiError('This request is not allowed.',403);
  try{target=new URL(`${requestUrl.protocol}//${host}`)}catch{throw new ApiError('This request is not allowed.',403)}
 }
 const allowed=[target],loopback=new Set(['localhost','127.0.0.1','[::1]']);
 if(process.env.APP_URL){
  const configured=new URL(process.env.APP_URL);
  // A default local APP_URL must not authorize a different local app/port.
  const staleLocal=process.env.NODE_ENV!=='production'&&loopback.has(configured.hostname)&&loopback.has(target.hostname)&&configured.port!==target.port;
  if(!staleLocal)allowed.push(configured);
 }
 if(allowed.some(url=>url.origin===origin))return;
 // Next's development server can normalize 127.0.0.1 to localhost.
 if(process.env.NODE_ENV!=='production'){
  try{const incoming=new URL(origin);if(loopback.has(incoming.hostname)&&allowed.some(url=>loopback.has(url.hostname)&&url.protocol===incoming.protocol&&url.port===incoming.port))return}catch{}
 }
 throw new ApiError('This request is not allowed.',403);
}
export async function bodyJson(request:Request):Promise<Record<string,unknown>>{if(!request.headers.get('content-type')?.includes('application/json'))throw new ApiError('Send a JSON request.');const buffer=await boundedBody(request,65536);try{const value=JSON.parse(buffer.toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();return value}catch{throw new ApiError('Enter valid request details.')}}
export async function boundedBody(request:Request,max:number){if(Number(request.headers.get('content-length')||0)>max)throw new ApiError('The upload is too large.',413);const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new ApiError('The upload is too large.',413)}chunks.push(value)}return Buffer.concat(chunks)}
export const text=(value:unknown,max=200)=>typeof value==='string'?value.trim().slice(0,max):'';
export function requiredText(value:unknown,label:string,max=200,min=1){const result=text(value,max);if(result.length<min)throw new ApiError(`Enter ${label}.`);return result}
export function numberValue(value:unknown,label:string,min=0,max=10000000,integer=false){const number=Number(value);if(!['number','string'].includes(typeof value)||(typeof value==='string'&&!value.trim())||!Number.isFinite(number)||number<min||number>max||(integer&&!Number.isInteger(number)))throw new ApiError(`Enter a valid ${label}.`);return number}
export function moneyValue(value:unknown,label:string,min=0,max=10000000){const amount=numberValue(value,label,min,max),paise=Math.round(amount*100);if(Math.abs(amount*100-paise)>0.000001)throw new ApiError(`Use no more than two decimal places for ${label}.`);return paise/100}
export function emailValue(value:unknown,required=false){const email=text(value,254).toLowerCase();if((email||required)&&! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError('Enter a valid email address.');return email}
export function phoneValue(value:unknown){let phone=text(value,32).replace(/[\s()-]/g,'');if(/^[6-9]\d{9}$/.test(phone))phone=`+91${phone}`;if(!/^\+[1-9]\d{7,14}$/.test(phone))throw new ApiError('Enter a valid mobile number with country code.');return phone}
export function urlValue(value:unknown,{internal=false,empty=true}:{internal?:boolean;empty?:boolean}={}){
 const valueText=text(value,1500),message=internal?'Use a store link starting with /.':'Use an HTTPS image or link URL.';
 if(!valueText&&empty)return '';
 // Browsers remove embedded tabs and other controls while resolving URLs.
 if(valueText.includes('\\')||Array.from(valueText).some(character=>character.charCodeAt(0)<32||character.charCodeAt(0)===127))throw new ApiError(message);
 if(valueText.startsWith('/')&&!valueText.startsWith('//'))return valueText;
 if(!internal){try{const url=new URL(valueText);if(url.protocol==='https:'&&!url.username&&!url.password)return url.toString()}catch{}}
 throw new ApiError(message);
}
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function limit(state:StoreState,key:string,max:number,windowMs:number){const now=Date.now(),existing=state.limits[key];if(!existing||existing.resetAt<=now){state.limits[key]={count:1,resetAt:now+windowMs};return}if(existing.count>=max)throw new ApiError('Too many attempts. Please try again later.',429,Math.ceil((existing.resetAt-now)/1000));existing.count++}
export const requestIp=(request:Request)=>digest(request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'local');
export function usernameValue(value:unknown){const username=text(value,40).toLowerCase();if(username.length<3||!/^[a-z][a-z0-9._-]*(?:@[a-z0-9][a-z0-9.-]*)?$/.test(username)||typeof value!=='string'||value.trim().length>40)throw new ApiError('Use 3–40 letters, numbers, dots, underscores or hyphens, starting with a letter. An email-style username may include one @.');return username}
export async function hashPassword(password:string,{minimumLength=12}:{minimumLength?:8|12}={}){if(password.length<minimumLength||password.length>128)throw new ApiError(`Use a password with ${minimumLength} to 128 characters.`);const salt=randomBytes(16).toString('hex'),key=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt}:${key.toString('hex')}`}
export async function verifyPassword(password:string,stored:string){try{const [algorithm,salt,hash]=stored.split(':');if(algorithm!=='scrypt'||!salt||!hash)return false;const actual=await scrypt(password,salt,64) as Buffer,expected=Buffer.from(hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected)}catch{return false}}
export function publicAdmin(admin:AdminUser):PublicAdmin{return{id:admin.id,name:admin.name,email:admin.email,...(admin.username?{username:admin.username}:{}),role:admin.role,active:admin.active,createdAt:admin.createdAt,updatedAt:admin.updatedAt}}
export function publicCustomer(user:Customer):PublicCustomer{return{id:user.id,phone:user.phone,name:user.name,email:user.email,addresses:user.addresses,wishlist:user.wishlist,marketingConsent:user.marketingConsent,createdAt:user.createdAt,reviews:user.reviews||[],rewardsJoinedAt:user.rewardsJoinedAt||''}}
const cookieName=(kind:'admin'|'customer')=>kind==='admin'?(appSurface()==='admin'?'velora_admin_portal_session':'velora_admin_session'):'velora_customer_session';
export async function currentIdentity(kind:'admin'|'customer',state?:StoreState){if(!identityAllowed(kind))return null;const token=(await cookies()).get(cookieName(kind))?.value;if(!token)return null;const data=state||await readStore(),session=data.sessions.find(s=>s.kind===kind&&s.hash===digest(token)&&Date.parse(s.expiresAt)>Date.now());if(!session)return null;if(kind==='admin')return data.admins.find(a=>a.id===session.subjectId&&a.active)||null;return data.customers.find(u=>u.id===session.subjectId&&u.status==='active')||null}
export async function requireAdmin(roles:AdminRole[]=['owner','manager','support']){const admin=await currentIdentity('admin') as AdminUser|null;if(!admin)throw new ApiError('Sign in to your administrator account.',401);if(!roles.includes(admin.role))throw new ApiError('Your role does not have permission for this action.',403);return admin}
export async function requireCustomer(){const user=await currentIdentity('customer') as Customer|null;if(!user)throw new ApiError('Sign in to continue.',401);return user}
export async function issueSession(kind:'admin'|'customer',subjectId:string,{remember=false}:{remember?:boolean}={}){if(!identityAllowed(kind))throw new ApiError('Not found.',404);const token=randomBytes(32).toString('base64url'),lifetime=kind==='admin'?8*3600:30*86400;await mutateStore(state=>{state.sessions.push({id:randomBytes(12).toString('hex'),hash:digest(token),kind,subjectId,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+lifetime*1000).toISOString()})});(await cookies()).set(cookieName(kind),token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:kind==='admin'?'strict':'lax',path:'/',...(kind==='customer'||remember?{maxAge:lifetime}:{})})}
export async function revokeSession(kind:'admin'|'customer'){const token=(await cookies()).get(cookieName(kind))?.value;if(token)await mutateStore(state=>{state.sessions=state.sessions.filter(s=>s.hash!==digest(token))});(await cookies()).set(cookieName(kind),'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0})}
