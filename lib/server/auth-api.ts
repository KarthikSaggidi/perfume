import {randomBytes,randomInt,randomUUID,createHmac,timingSafeEqual} from 'node:crypto';
import type {AdminUser,Customer} from '../commerce-types';
import {assertSmsRequestAllowed,smsMode,twilioRequest} from './sms';
import {audit,mutateStore,readStore} from './store';
import {ApiError,apiError,bodyJson,checkSurface,checkOrigin,currentIdentity,digest,hashPassword,issueSession,json,limit,phoneValue,publicAdmin,publicCustomer,requestIp,requireAdmin,revokeSession,text,verifyPassword} from './security';
const runtime=globalThis as typeof globalThis&{veloraOtpSecret?:string};
const otpSecret=process.env.AUTH_SECRET||(runtime.veloraOtpSecret??=randomBytes(32).toString('hex'));
const codeDigest=(id:string,code:string)=>createHmac('sha256',otpSecret).update(`${id}:${code}`).digest('hex');
export {smsMode} from './sms';
async function requestOtp(request:Request){
 const body=await bodyJson(request),phone=phoneValue(body.phone),provider=smsMode();
 assertSmsRequestAllowed(request,phone);
 if(provider==='unconfigured')throw new ApiError('SMS sign-in is not connected yet. Please contact the store or try again later.',503);
 const allowed=(process.env.OTP_ALLOWED_COUNTRY_CODES||'+91').split(',').map(value=>value.trim()).filter(value=>/^\+[1-9]\d{0,3}$/.test(value));if(!allowed.some(prefix=>phone.startsWith(prefix)))throw new ApiError('SMS sign-in is not available for this country yet. Please contact the store.');
 const id=randomUUID(),code=provider==='development'?String(randomInt(100000,1000000)):'';
 await mutateStore(state=>{
  limit(state,'otp-global-hour',100,3600000);limit(state,'otp-global-day',500,86400000);
  limit(state,`otp-ip:${requestIp(request)}`,12,3600000);
  limit(state,`otp-number:${digest(phone)}`,5,3600000);
  const previous=state.challenges.filter(c=>c.phone===phone).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  if(previous&&Date.now()-Date.parse(previous.createdAt)<60000)throw new ApiError('Please wait before requesting another code.',429,Math.ceil((60000-Date.now()+Date.parse(previous.createdAt))/1000));
  const customer=state.customers.find(c=>c.phone===phone);
  if(customer?.status==='blocked')throw new ApiError('This account is unavailable. Please contact the store.',403);
  if(!customer&&!state.settings.allowCustomerSignup)throw new ApiError('New registrations are currently paused.',403);
  state.challenges.filter(c=>c.phone===phone&&c.status!=='used').forEach(c=>c.status='expired');
  state.challenges.push({id,phone,provider,hash:code?codeDigest(id,code):'',status:'pending',attempts:0,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+600000).toISOString()});
 });
 try{
  if(provider==='twilio')await twilioRequest('Verifications',{To:phone,Channel:'sms'});
  await mutateStore(state=>{const challenge=state.challenges.find(c=>c.id===id);if(challenge)challenge.status='active'});
  if(provider==='development')console.info(`[ALORA local OTP] ${phone}: ${code} (development only; expires in 10 minutes)`);
 }catch(error){await mutateStore(state=>{const challenge=state.challenges.find(c=>c.id===id);if(challenge)challenge.status='expired'});throw error}
 return json({challengeId:id,maskedPhone:`${phone.slice(0,Math.min(3,phone.length-4))}${'•'.repeat(Math.max(4,phone.length-7))}${phone.slice(-4)}`,retryAfter:60,expiresIn:600,...(provider==='development'?{development:true}:{})});
}
async function verifyOtp(request:Request){
 assertSmsRequestAllowed(request);
 const body=await bodyJson(request),id=text(body.challengeId,60),code=text(body.code,10);
 if(!/^[0-9]{6}$/.test(code)||!id)throw new ApiError('Enter the six-digit verification code.');
 const challenge=await mutateStore(state=>{
  limit(state,`otp-check:${requestIp(request)}`,40,900000);
  const record=state.challenges.find(c=>c.id===id);
  if(!record||record.status!=='active'||Date.parse(record.expiresAt)<=Date.now()||record.attempts>=5)return null;
  record.attempts++;
  return {...record};
 });
 if(!challenge)throw new ApiError('This code has expired or reached its attempt limit. Request a new one.');
 assertSmsRequestAllowed(request,challenge.phone);
 let approved=false;
 if(challenge.provider==='twilio')approved=(await twilioRequest('VerificationCheck',{To:challenge.phone,Code:code})).status==='approved';
 else if(smsMode()==='development'){const actual=Buffer.from(codeDigest(id,code),'hex'),expected=Buffer.from(challenge.hash,'hex');approved=actual.length===expected.length&&timingSafeEqual(actual,expected)}
 if(!approved)throw new ApiError('That code is incorrect. Please try again.');
 const user=await mutateStore(state=>{
  const record=state.challenges.find(c=>c.id===id);
  if(!record||record.status!=='active'||Date.parse(record.expiresAt)<=Date.now())throw new ApiError('This code has already been used. Request another one.');
  let customer=state.customers.find(c=>c.phone===record.phone);
  if(customer?.status==='blocked')throw new ApiError('This account is unavailable.',403);
  if(!customer&&!state.settings.allowCustomerSignup)throw new ApiError('New registrations are currently paused.',403);
  const now=new Date().toISOString();
  if(!customer){customer={id:randomUUID(),phone:record.phone,name:'',email:'',addresses:[],wishlist:[],tags:[],notes:'',marketingConsent:false,status:'active',createdAt:now,updatedAt:now,lastLoginAt:now};state.customers.push(customer)}
  customer.lastLoginAt=now;customer.updatedAt=now;record.status='used';
  return publicCustomer(customer);
 });
 await issueSession('customer',user.id);return json({user});
}
async function adminLogin(request:Request){
 const body=await bodyJson(request),rawIdentifier=body.identifier??body.username??body.email,identifier=text(rawIdentifier,254).toLowerCase(),password=typeof body.password==='string'?body.password:'';
 if(body.rememberMe!==undefined&&typeof body.rememberMe!=='boolean')throw new ApiError('Choose a valid session preference.');
 if(!identifier||typeof rawIdentifier!=='string'||rawIdentifier.trim().length>254||password.length>128)throw new ApiError('Username, email or password is incorrect.',401);
 const state=await readStore(),admin=state.admins.find(account=>account.active&&(account.email===identifier||account.username?.toLowerCase()===identifier));
 await mutateStore(state=>{limit(state,`admin-ip:${requestIp(request)}`,15,900000);limit(state,`admin-email:${digest(admin?.email||identifier)}`,10,900000)});
 const dummy=`scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
 const valid=await verifyPassword(password,admin?.passwordHash||dummy);
 if(!admin||!valid)throw new ApiError('Username, email or password is incorrect.',401);
 await issueSession('admin',admin.id,{remember:body.rememberMe===true});await mutateStore(data=>audit(data,admin.email,'Signed in','Administration'));
 return json({admin:publicAdmin(admin)});
}
export async function handleAuth(request:Request,segments:string[]){
 try{
  checkSurface(request);
  const action=segments.join('/');
  if(request.method==='GET'&&action==='session'){
   const state=await readStore(),user=await currentIdentity('customer',state) as Customer|null,admin=await currentIdentity('admin',state) as AdminUser|null;
   return json({user:user?publicCustomer(user):null,admin:admin?publicAdmin(admin):null});
  }
  if(request.method!=='POST')throw new ApiError('Method not allowed.',405);
  checkOrigin(request);
  if(action==='otp/request')return await requestOtp(request);
  if(action==='otp/verify')return await verifyOtp(request);
  if(action==='admin/login')return await adminLogin(request);
  if(action==='logout'||action==='admin/logout'){await revokeSession(action==='logout'?'customer':'admin');return json({ok:true})}
  if(action==='admin/password'){
   const admin=await requireAdmin(),body=await bodyJson(request),current=typeof body.currentPassword==='string'?body.currentPassword:'',next=typeof body.newPassword==='string'?body.newPassword:'';
   await mutateStore(state=>limit(state,`password:${admin.id}`,5,900000));
   if(!await verifyPassword(current,admin.passwordHash))throw new ApiError('Your current password is incorrect.',403);
   const passwordHash=await hashPassword(next);
   await mutateStore(state=>{const user=state.admins.find(a=>a.id===admin.id)!;user.passwordHash=passwordHash;user.updatedAt=new Date().toISOString();state.sessions=state.sessions.filter(s=>s.subjectId!==admin.id||s.kind!=='admin');audit(state,admin.email,'Changed password','Account security')});
   await issueSession('admin',admin.id);return json({ok:true});
  }
  throw new ApiError('Not found.',404);
 }catch(error){return apiError(error)}
}
