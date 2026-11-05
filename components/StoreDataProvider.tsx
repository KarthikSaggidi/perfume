'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {products as seedProducts,type Product} from '@/lib/products';
import type {AuthSession,Poster,PublicCatalog,PublicCustomer} from '@/lib/commerce-types';
type StoreData={products:Product[];posters:Poster[];settings:PublicCatalog['settings'];loaded:boolean;offer?:PublicCatalog['offer'];user:PublicCustomer|null;authLoading:boolean;refresh:()=>Promise<void>;refreshAuth:()=>Promise<void>};
const defaults:PublicCatalog['settings']={storeName:'ALORA',description:'Scents beyond boundaries.',shippingFee:0,freeShippingThreshold:0,taxRate:0,codEnabled:false,announcement:'',supportEmail:'',maintenanceMode:false};
const StoreContext=createContext<StoreData>({products:seedProducts,posters:[],settings:defaults,loaded:false,offer:undefined,user:null,authLoading:true,refresh:async()=>{},refreshAuth:async()=>{}});
export const useStorefront=()=>useContext(StoreContext);
export default function StoreDataProvider({children}:{children:ReactNode}){
 const [catalog,setCatalog]=useState<{products:Product[];posters:Poster[];settings:PublicCatalog['settings'];offer?:PublicCatalog['offer']}>({products:seedProducts,posters:[],settings:defaults}),[loaded,setLoaded]=useState(false),[user,setUser]=useState<PublicCustomer|null>(null),[authLoading,setAuthLoading]=useState(true);
 const catalogRequest=useRef(0),authRequest=useRef(0),authOwner=useRef<string|null>(null);
 const refresh=useCallback(async()=>{const request=++catalogRequest.current;try{const response=await fetch('/api/catalog',{cache:'no-store'});if(!response.ok)return;const data=await response.json() as PublicCatalog;if(request!==catalogRequest.current)return;setCatalog(data);setLoaded(true)}catch{}},[]);
 const refreshAuth=useCallback(async()=>{
  const request=++authRequest.current;
  try{
   const response=await fetch('/api/auth/session',{cache:'no-store'});if(!response.ok)return;
   const data=await response.json() as AuthSession;if(request!==authRequest.current)return;
   setUser(data.user);
   try{
    if(data.user){localStorage.setItem('aurealis-wishlist',JSON.stringify(data.user.wishlist));localStorage.setItem('velora-wishlist-owner',data.user.id);window.dispatchEvent(new Event('aurealis-wishlist-change'))}
    else if(localStorage.getItem('velora-wishlist-owner')){localStorage.removeItem('aurealis-wishlist');localStorage.removeItem('velora-wishlist-owner');window.dispatchEvent(new Event('aurealis-wishlist-change'))}
   }catch{}
   const owner=data.user?.id||null;if(authOwner.current!==owner){authOwner.current=owner;window.dispatchEvent(new Event('velora-session-change'));window.dispatchEvent(new Event('velora-catalog-change'))}
  }catch{}finally{if(request===authRequest.current)setAuthLoading(false)}
 },[]);
 useEffect(()=>{void refresh();void refreshAuth();const auth=()=>void refreshAuth(),focus=()=>{void refresh();void refreshAuth()};window.addEventListener('velora-auth-change',auth);window.addEventListener('velora-catalog-change',refresh);window.addEventListener('focus',focus);const interval=setInterval(()=>{if(!document.hidden)focus()},60000);return()=>{window.removeEventListener('velora-auth-change',auth);window.removeEventListener('velora-catalog-change',refresh);window.removeEventListener('focus',focus);clearInterval(interval)}},[refresh,refreshAuth]);
 return <StoreContext.Provider value={{...catalog,loaded,user,authLoading,refresh,refreshAuth}}>{children}</StoreContext.Provider>;
}
