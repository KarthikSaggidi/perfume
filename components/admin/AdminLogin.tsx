'use client';

import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowRight,Eye,EyeOff,LoaderCircle,LockKeyhole,UserRound} from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

export default function AdminLogin(){
 const router=useRouter();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[visible,setVisible]=useState(false),[rememberMe,setRememberMe]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[ready,setReady]=useState(false),[recovery,setRecovery]=useState(false);
 const errorRef=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{setReady(true);const controller=new AbortController();void fetch('/api/admin/bootstrap',{signal:controller.signal,cache:'no-store'}).then(response=>{if(response.ok)router.replace('/admin')}).catch(()=>{});return()=>controller.abort()},[router]);
 useEffect(()=>{if(error)errorRef.current?.focus()},[error]);
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(!ready||busy)return;setBusy(true);setError('');
  try{
   const response=await fetch('/api/auth/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:email.trim(),password,rememberMe})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||'Unable to sign in. Please try again.');
   router.replace('/admin');router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:'Unable to sign in. Please try again.');setBusy(false)}
 };
 return <AuthShell variant="admin"><div className="velora-auth-heading"><h1 id="signin-title">Store Administration</h1><p>Sign in to manage your ALORA store.</p></div>
  {error&&<p ref={errorRef} tabIndex={-1} className="velora-auth-error" id="admin-login-error" role="alert">{error}</p>}
  <form className="velora-auth-form" onSubmit={submit} aria-busy={!ready||busy}>
   <label className="velora-auth-field" htmlFor="admin-email"><span className="velora-auth-sr-only">Username or email</span><div className="velora-auth-control"><UserRound size={22} strokeWidth={1.7} aria-hidden="true"/><input id="admin-email" name="username" type="text" disabled={!ready||busy} value={email} onChange={event=>setEmail(event.target.value)} required autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Username or email" maxLength={254} aria-describedby={error?'admin-login-error':undefined}/></div></label>
   <label className="velora-auth-field" htmlFor="admin-password"><span className="velora-auth-sr-only">Password</span><div className="velora-auth-control"><LockKeyhole size={22} strokeWidth={1.7} aria-hidden="true"/><input id="admin-password" name="password" disabled={!ready||busy} type={visible?'text':'password'} value={password} onChange={event=>setPassword(event.target.value)} required autoComplete="current-password" placeholder="Password" maxLength={128} aria-describedby={error?'admin-login-error':undefined}/><button type="button" disabled={!ready||busy} aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} aria-controls="admin-password" onClick={()=>setVisible(value=>!value)}>{visible?<EyeOff size={22}/>:<Eye size={22}/>}</button></div></label>
   <div className="velora-auth-remember-row"><label className="velora-auth-remember" title="Stay signed in for up to eight hours on this device"><input type="checkbox" name="rememberMe" checked={rememberMe} onChange={event=>setRememberMe(event.target.checked)} disabled={!ready||busy}/>Remember me</label><button type="button" className="velora-auth-link" disabled={!ready||busy} aria-expanded={recovery} aria-controls="admin-login-recovery" onClick={()=>setRecovery(value=>!value)}>Forgot password?</button></div>
   {recovery&&<section className="velora-auth-recovery" id="admin-login-recovery" aria-labelledby="admin-recovery-title"><h2 id="admin-recovery-title">Restore administrator access</h2><p>Contact your store owner or server administrator to restore access. If you manage this installation, run this command in the project terminal:</p><code>npm run admin:create -- --reset</code><p>Your password is entered privately. Return here to sign in after resetting it.</p></section>}
   <button className="velora-auth-submit" type="submit" disabled={!ready||busy}>{busy?<><LoaderCircle size={20} className="velora-auth-spinner"/>Signing in…</>:<>Sign In<ArrowRight size={23}/></>}</button>
  </form><p className="velora-auth-security"><LockKeyhole size={17} aria-hidden="true"/><span>Administrator access only.</span></p>
 </AuthShell>;
}
