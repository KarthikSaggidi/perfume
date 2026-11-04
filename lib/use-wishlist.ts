'use client';

import {useEffect,useRef,useState} from 'react';
import {useStorefront} from '@/components/StoreDataProvider';

function guestWishlist():string[]{
 const stored=localStorage.getItem('aurealis-wishlist')||'[]';
 try{const value:unknown=JSON.parse(stored);return Array.isArray(value)?value.filter((id):id is string=>typeof id==='string'):[]}catch{return[]}
}

export function useWishlist(productId:string){
 const {user,refreshAuth,authLoading,loaded}=useStorefront();
 const ready=!authLoading&&loaded;
 const [guestSaved,setGuestSaved]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const pending=useRef(false);
 useEffect(()=>{
  const sync=()=>{try{setGuestSaved(guestWishlist().includes(productId))}catch{}};
  const storage=(event:StorageEvent)=>{if(event.key==='aurealis-wishlist'||event.key===null)sync()};
  sync();window.addEventListener('aurealis-wishlist-change',sync);window.addEventListener('storage',storage);
  return()=>{window.removeEventListener('aurealis-wishlist-change',sync);window.removeEventListener('storage',storage)};
 },[productId]);
 const saved=user?user.wishlist.includes(productId):guestSaved;
 const toggle=async()=>{
  if(pending.current||!ready)return;
  pending.current=true;setSaving(true);setError('');
  try{
   if(user){
    const response=await fetch('/api/account/wishlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId,saved:!saved})});
    if(!response.ok){if(response.status===401)window.dispatchEvent(new Event('velora-auth-change'));const data=await response.json().catch(()=>({}));throw new Error(data.error||'Your favourite could not be saved. Please try again.')}
    await refreshAuth();
   }else{
    const list=guestWishlist(),next=list.includes(productId)?list.filter(id=>id!==productId):[...new Set([...list,productId])];
    localStorage.setItem('aurealis-wishlist',JSON.stringify(next));setGuestSaved(next.includes(productId));window.dispatchEvent(new Event('aurealis-wishlist-change'));
   }
  }catch(reason){setError(reason instanceof Error?reason.message:'Your favourite could not be saved. Please try again.')}
  finally{pending.current=false;setSaving(false)}
 };
 return {saved,saving,error,toggle,ready};
}
