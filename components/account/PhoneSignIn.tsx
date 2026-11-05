'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronDown,LoaderCircle,Phone} from 'lucide-react';
import type {PublicCustomer} from '@/lib/commerce-types';
import AuthShell from '@/components/auth/AuthShell';
import {accountError,accountRequest,AccountApiError} from './api';

type Challenge={challengeId:string;maskedPhone:string;retryAfter:number;expiresIn:number;development?:boolean};
const countries=[['+91','India (+91)'],['+1','US / Canada (+1)'],['+44','United Kingdom (+44)'],['+971','UAE (+971)'],['+65','Singapore (+65)'],['+61','Australia (+61)'],['custom','Another country']];
const countdown=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;

export default function PhoneSignIn({onAuthenticated,returningToCheckout}:{onAuthenticated:(user:PublicCustomer)=>Promise<void>;returningToCheckout:boolean}){
 const [callingCode,setCallingCode]=useState('+91'),[customCode,setCustomCode]=useState('+'),[phone,setPhone]=useState('');
 const [challenge,setChallenge]=useState<Challenge|null>(null),[code,setCode]=useState<string[]>(Array(6).fill(''));
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[retryAt,setRetryAt]=useState(0),[expiresAt,setExpiresAt]=useState(0),[now,setNow]=useState(0),[sentAgain,setSentAgain]=useState(false);
 const digits=useRef<Array<HTMLInputElement|null>>([]),phoneInput=useRef<HTMLInputElement>(null),errorRef=useRef<HTMLParagraphElement>(null);
 const retryRemaining=Math.max(0,Math.ceil((retryAt-now)/1000)),expiresRemaining=Math.max(0,Math.ceil((expiresAt-now)/1000));
 useEffect(()=>{if(!retryAt&&!expiresAt)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[retryAt,expiresAt]);
 useEffect(()=>{if(challenge)digits.current[0]?.focus()},[challenge]);
 useEffect(()=>{if(error)errorRef.current?.focus()},[error]);

 const requestCode=async(resend=false)=>{
  if(busy||retryRemaining>0)return;
  setError('');setSentAgain(false);setBusy(true);
  const dial=callingCode==='custom'?customCode:callingCode;
  const number=phone.trim().startsWith('+')?`+${phone.replace(/\D/g,'')}`:`+${dial.replace(/\D/g,'')}${phone.replace(/\D/g,'')}`;
  if(!/^\+[1-9]\d{7,14}$/.test(number)){setError('Enter a valid mobile number, including your country calling code.');setBusy(false);return}
  try{
   const result=await accountRequest<Challenge>('/api/auth/otp/request',{method:'POST',body:JSON.stringify({phone:number})});
   const receivedAt=Date.now();setChallenge(result);setCode(Array(6).fill(''));setRetryAt(receivedAt+Math.max(0,result.retryAfter)*1000);setExpiresAt(receivedAt+result.expiresIn*1000);setNow(receivedAt);setSentAgain(resend);
  }catch(reason){setError(accountError(reason));if(reason instanceof AccountApiError&&reason.retryAfter){const receivedAt=Date.now();setRetryAt(receivedAt+reason.retryAfter*1000);setNow(receivedAt)}}finally{setBusy(false)}
 };
 const verify=async()=>{
  if(!challenge||busy)return;
  if(!expiresRemaining){setError('This code has expired. Request a new code to continue.');return}
  if(code.join('').length!==6){setError('Enter all six digits from your text message.');return}
  setError('');setBusy(true);
  try{const result=await accountRequest<{user:PublicCustomer}>('/api/auth/otp/verify',{method:'POST',body:JSON.stringify({challengeId:challenge.challengeId,code:code.join('')})});await onAuthenticated(result.user)}catch(reason){setError(accountError(reason));setBusy(false)}
 };
 const enterDigits=(value:string,index:number)=>{
  const clean=value.replace(/\D/g,'');
  if(!clean){setCode(current=>current.map((digit,i)=>i===index?'':digit));return}
  const values=clean.slice(0,6-index).split('');
  setCode(current=>{const next=[...current];values.forEach((digit,i)=>next[index+i]=digit);return next});
  digits.current[Math.min(5,index+values.length)]?.focus();
 };
 const changeNumber=()=>{setChallenge(null);setCode(Array(6).fill(''));setError('');setSentAgain(false);setRetryAt(0);setExpiresAt(0);setTimeout(()=>phoneInput.current?.focus(),0)};

 return <AuthShell verify={Boolean(challenge)}><div className="velora-auth-heading"><h1 id="signin-title">{challenge?'Verify your number':'Welcome Back'}</h1><p>{challenge?<>Enter the six-digit code sent to <strong>{challenge.maskedPhone}</strong>.</>:returningToCheckout?'Sign in with OTP to complete your order':'Sign in to your ALORA account with OTP'}</p></div>
  {error&&<p id="account-signin-error" className="velora-auth-error" role="alert" ref={errorRef} tabIndex={-1}>{error}</p>}
  {challenge?<form className="velora-auth-form" onSubmit={event=>{event.preventDefault();void verify()}} aria-busy={busy}>
   <fieldset className="velora-auth-otp" disabled={busy}><legend>Verification code</legend><div className="velora-auth-digits" onPaste={event=>{const pasted=event.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);if(pasted){event.preventDefault();setCode(Array.from({length:6},(_,i)=>pasted[i]||''));digits.current[Math.min(5,pasted.length)]?.focus()}}}>{code.map((digit,index)=><input key={index} ref={node=>{digits.current[index]=node}} type="text" inputMode="numeric" pattern="[0-9]*" autoComplete={index===0?'one-time-code':'off'} maxLength={6} aria-label={`Verification code digit ${index+1} of 6`} aria-describedby={error?'account-signin-error':'account-otp-help'} value={digit} onChange={event=>enterDigits(event.target.value,index)} onKeyDown={event=>{if(event.key==='Backspace'&&!code[index]&&index>0){event.preventDefault();setCode(current=>current.map((value,i)=>i===index-1?'':value));digits.current[index-1]?.focus()}else if(event.key==='ArrowLeft'&&index>0){event.preventDefault();digits.current[index-1]?.focus()}else if(event.key==='ArrowRight'&&index<5){event.preventDefault();digits.current[index+1]?.focus()}}} onFocus={event=>event.target.select()}/>)}</div></fieldset>
   <p className="velora-auth-otp-help" id="account-otp-help">{expiresRemaining?`For your security, this code expires in ${countdown(expiresRemaining)}.`:'This code has expired. Request a new one below.'}</p>
   {challenge.development&&<p className="velora-auth-development">Local development: retrieve the test code from the server terminal.</p>}
   <button className="velora-auth-submit" type="submit" disabled={busy||code.some(digit=>!digit)||!expiresRemaining}>{busy?<><LoaderCircle size={20} className="velora-auth-spinner"/>Verifying…</>:<>{returningToCheckout?'Verify & continue to checkout':'Verify & sign in'}<ArrowRight size={23}/></>}</button>
   <div className="velora-auth-otp-actions"><button type="button" disabled={busy} onClick={changeNumber}><ArrowLeft size={15}/>Change number</button><button type="button" disabled={busy||retryRemaining>0} onClick={()=>void requestCode(true)}>{retryRemaining>0?`Resend in ${countdown(retryRemaining)}`:'Resend code'}</button></div>
   {sentAgain&&<p className="velora-auth-success" role="status"><Check size={15}/>A fresh code has been sent.</p>}
  </form>:<form className="velora-auth-form" onSubmit={event=>{event.preventDefault();void requestCode()}} aria-busy={busy}>
   <div className="velora-auth-field"><label className="velora-auth-field-label velora-auth-phone-label" id="account-phone-label" htmlFor="account-phone">Mobile Number</label><div className="velora-auth-control velora-auth-phone"><Phone size={22} strokeWidth={1.7} aria-hidden="true"/><div className="velora-auth-dial"><span aria-hidden="true">{callingCode==='custom'?customCode:callingCode}</span><ChevronDown size={17} aria-hidden="true"/><select id="account-country" aria-label="Country / region" value={callingCode} disabled={busy} onChange={event=>setCallingCode(event.target.value)}>{countries.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div><input id="account-phone" name="phone" aria-labelledby="account-phone-label" ref={phoneInput} value={phone} onChange={event=>setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="Enter your mobile number" required maxLength={22} disabled={busy} aria-describedby={error?'account-signin-error':'account-phone-help'}/></div></div>
   {callingCode==='custom'&&<label className="velora-auth-field velora-auth-custom-code" htmlFor="account-calling-code"><span>Country calling code</span><div className="velora-auth-control"><input id="account-calling-code" value={customCode} onChange={event=>setCustomCode(`+${event.target.value.replace(/\D/g,'').slice(0,4)}`)} type="tel" inputMode="tel" autoComplete="tel-country-code" placeholder="+49" pattern="\+[1-9][0-9]{0,3}" maxLength={5} required disabled={busy}/></div></label>}
   <p className="velora-auth-phone-help" id="account-phone-help">We’ll send you a verification code by SMS.</p><button className="velora-auth-submit" type="submit" disabled={busy||retryRemaining>0}>{busy?<><LoaderCircle size={20} className="velora-auth-spinner"/>Sending OTP…</>:<>{retryRemaining>0?`Try again in ${countdown(retryRemaining)}`:'Send OTP'}<ArrowRight size={23}/></>}</button>
  </form>}
 </AuthShell>;
}
