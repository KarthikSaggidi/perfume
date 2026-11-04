'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {ArrowRight,LoaderCircle,RefreshCw} from 'lucide-react';
import ProductCommerce from '@/components/ProductCommerce';
import AuthShell from '@/components/auth/AuthShell';
import type {AuthSession,Order,PublicCustomer} from '@/lib/commerce-types';
import PhoneSignIn from './PhoneSignIn';
import AccountDashboard from './AccountDashboard';
import {accountError,accountRequest,AccountApiError,notifyAccountChange,safeAccountReturnTo} from './api';

type AccountData={user:PublicCustomer;orders:Order[]};
export default function AccountPortal(){
  const router=useRouter(),params=useSearchParams(),returnTo=safeAccountReturnTo(params.get('returnTo'));
  const [data,setData]=useState<AccountData|null>(null),[state,setState]=useState<'loading'|'ready'|'error'>('loading'),[error,setError]=useState(''),[migrationNotice,setMigrationNotice]=useState('');
  const loadRequest=useRef(0);
  const load=useCallback(async(signal?:AbortSignal)=>{
    const request=++loadRequest.current;
    try{const session=await accountRequest<AuthSession>('/api/auth/session',{signal});if(request!==loadRequest.current||signal?.aborted)return;if(!session.user){setData(null);setState('ready');return}const result=await accountRequest<AccountData>('/api/account',{signal});if(request!==loadRequest.current||signal?.aborted)return;setData(result);setState('ready');setError('')}catch(e){if(signal?.aborted||request!==loadRequest.current)return;if(e instanceof AccountApiError&&e.status===401){setData(null);setState('ready');return}setError(accountError(e));setState('error')}
  },[]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
  useEffect(()=>{const update=()=>void load(),visible=()=>{if(!document.hidden)update()};window.addEventListener('focus',update);window.addEventListener('velora-auth-change',update);window.addEventListener('velora-session-change',update);document.addEventListener('visibilitychange',visible);return()=>{window.removeEventListener('focus',update);window.removeEventListener('velora-auth-change',update);window.removeEventListener('velora-session-change',update);document.removeEventListener('visibilitychange',visible)}},[load]);
  const authenticated=async(user:PublicCustomer)=>{
    loadRequest.current++;
    let guest:string[]=[];
    try{const saved:unknown=JSON.parse(localStorage.getItem('aurealis-wishlist')||'[]');if(Array.isArray(saved))guest=[...new Set(saved.filter((id):id is string=>typeof id==='string'&&id.length>0&&id.length<=100))].filter(id=>!user.wishlist.includes(id)).slice(0,30)}catch{}
    if(guest.length){const results=await Promise.allSettled(guest.map(productId=>accountRequest('/api/account/wishlist',{method:'POST',body:JSON.stringify({productId,saved:true})})));if(results.some(result=>result.status==='rejected'&&!(result.reason instanceof AccountApiError&&result.reason.status===404)))setMigrationNotice('Some guest favourites could not be moved to your account. Please save them again from the collection.')}
    setData({user,orders:[]});notifyAccountChange();if(returnTo!=='/account'){router.replace(returnTo);router.refresh();return}await load();router.refresh()};
  const refresh=async()=>{const next=await accountRequest<AccountData>('/api/account');setData(next);notifyAccountChange()};
  const logout=async()=>{loadRequest.current++;await accountRequest('/api/auth/logout',{method:'POST'});setData(null);setState('ready');setMigrationNotice('');try{localStorage.removeItem('aurealis-wishlist');localStorage.removeItem('velora-wishlist-owner');window.dispatchEvent(new Event('aurealis-wishlist-change'))}catch{}notifyAccountChange();router.replace('/account');router.refresh()};
  if(!data&&state==='ready')return <PhoneSignIn onAuthenticated={authenticated} returningToCheckout={returnTo.startsWith('/checkout')}/>;
  if(!data)return <AuthShell><div className="velora-auth-heading"><h1 id="signin-title">Welcome Back</h1><p>Sign in to your Velora account with OTP</p></div>{state==='loading'?<div className="velora-auth-loading" role="status"><LoaderCircle className="velora-auth-spinner" size={22}/>Opening your account…</div>:<><p className="velora-auth-error" role="alert">{error}</p><button className="velora-auth-submit" onClick={()=>{setState('loading');void load()}}><RefreshCw size={18}/>Try again</button></>}</AuthShell>;
  return <ProductCommerce><main className="customer-account premium-account">{migrationNotice&&<p className="account-error" role="status">{migrationNotice}</p>}
    {state==='loading'?<div className="account-state-panel" role="status"><LoaderCircle className="account-spinner" size={26}/><p className="account-eyebrow">YOUR PERSONAL COLLECTION</p><h1>A moment, just for you.</h1><p>Opening your Velora account…</p></div>:state==='error'?<div className="account-state-panel"><p className="account-eyebrow">LET’S TRY THAT AGAIN</p><h1>Your account is waiting.</h1><p className="account-error" role="alert">{error}</p><button className="account-primary-button" onClick={()=>{setState('loading');void load()}}><RefreshCw size={16}/> Try again</button><a href="/shop">Keep exploring <ArrowRight size={15}/></a></div>:data?<AccountDashboard user={data.user} orders={data.orders} onRefresh={refresh} onLogout={logout}/>:<PhoneSignIn onAuthenticated={authenticated} returningToCheckout={returnTo.startsWith('/checkout')}/>}
  </main></ProductCommerce>;
}
