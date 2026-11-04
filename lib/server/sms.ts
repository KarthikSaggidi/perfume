import {ApiError} from './security';
import {localStorageAllowed} from './store';

const required=['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_VERIFY_SERVICE_SID'] as const;
const loopback=new Set(['localhost','127.0.0.1','[::1]']);
export const smsScope=() => process.env.VELORA_SMS_SCOPE==='all'?'all' as const:'localhost' as const;

export function smsMode():'twilio'|'development'|'unconfigured'{
 const mode=process.env.VELORA_SMS_MODE||'twilio';
 if(mode==='development')return process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&localStorageAllowed()?'development':'unconfigured';
 return required.every(key=>Boolean(process.env[key]))?'twilio':'unconfigured';
}

export function smsStatus(){
 const missing=required.filter(key=>!process.env[key]);
 return {mode:smsMode(),scope:smsScope(),missing,allowedCountries:(process.env.OTP_ALLOWED_COUNTRY_CODES||'+91').split(',').map(value=>value.trim()).filter(Boolean),testNumbersRestricted:Boolean(process.env.OTP_TEST_NUMBERS?.trim())};
}

export function assertSmsRequestAllowed(request:Request,phone?:string){
 if(smsScope()==='localhost'){
  let local=false;
  try{
   let url=new URL(request.url);const host=request.headers.get('host');
   if(host){if(!/^(?:[a-z0-9.-]+|\[[a-f0-9:]+\])(?::[0-9]{1,5})?$/i.test(host))throw new Error();url=new URL(`${url.protocol}//${host}`)}
   const origin=request.headers.get('origin');
   local=loopback.has(url.hostname)&&(!origin||loopback.has(new URL(origin).hostname));
  }catch{}
  if(process.env.NODE_ENV==='production'||process.env.VERCEL||!local)throw new ApiError('SMS verification is enabled for localhost only.',403);
 }
 const numbers=(process.env.OTP_TEST_NUMBERS||'').split(',').map(value=>value.trim()).filter(Boolean);
 if(phone&&numbers.length&&!numbers.includes(phone))throw new ApiError('This number is not enabled for local SMS testing.',403);
}

type VerifyResult={status?:string;code?:number;friendly_name?:string;code_length?:number};
export async function twilioRequest(endpoint:string,parameters?:Record<string,string>):Promise<VerifyResult>{
 const sid=process.env.TWILIO_VERIFY_SERVICE_SID||'';
 if(smsMode()!=='twilio'||!/^VA[a-fA-F0-9]{32}$/.test(sid))throw new ApiError('SMS verification is not configured. Please contact the store.',503);
 let response:Response;
 try{response=await fetch(`https://verify.twilio.com/v2/Services/${sid}${endpoint?'/'+endpoint:''}`,{
  method:parameters?'POST':'GET',headers:{Authorization:`Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,...(parameters?{'Content-Type':'application/x-www-form-urlencoded'}:{})},
  ...(parameters?{body:new URLSearchParams(parameters)}:{}),signal:AbortSignal.timeout(12000),cache:'no-store',
 })}catch{throw new ApiError('SMS verification is temporarily unavailable. Please try again.',503)}
 const data=await response.json().catch(()=>({})) as VerifyResult;
 if(!response.ok){
  if(response.status===429||data.code===60203)throw new ApiError('Please wait before requesting another code.',429,60);
  if(endpoint==='VerificationCheck'&&(response.status===404||data.code===60202))throw new ApiError('The code has expired or reached its attempt limit. Request a new one.');
  if(data.code===60200)throw new ApiError('Check the mobile number and country code.');
  if(data.code===21408)throw new ApiError('SMS delivery is not enabled for this country. Please contact the store.',503);
  throw new ApiError('The SMS provider could not complete the request. Check the provider connection and try again.',503);
 }
 return data;
}

export async function checkSmsConnection(request:Request){
 assertSmsRequestAllowed(request);
 if(smsMode()==='development')throw new ApiError('Terminal-code mode is active. Run npm run sms:setup to connect real SMS.',409);
 const service=await twilioRequest('');
 if(service.code_length!==6)throw new ApiError('Set your Twilio Verify service code length to six digits, then check again.',409);
 return {connected:true,name:service.friendly_name||'Twilio Verify',codeLength:6,scope:smsScope(),message:'Provider connection verified. No SMS was sent.'};
}
