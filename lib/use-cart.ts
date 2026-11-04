'use client';
import {useEffect,useState} from 'react';
export function useCart(){
 const [cart,setCart]=useState<Record<string,number>>({});
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{const sync=()=>{try{const value=JSON.parse(localStorage.getItem('aurealis-cart')||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))setCart(Object.fromEntries(Object.entries(value).filter(([key,quantity])=>/^[a-z0-9][a-z0-9-]{1,63}(?::100)?$/.test(key)&&Number.isInteger(quantity)&&Number(quantity)>0&&Number(quantity)<=99).map(([key,quantity])=>[key,Number(quantity)] as const)))}catch{}};sync();setLoaded(true);const storage=(event:StorageEvent)=>{if(event.key==='aurealis-cart'||event.key===null)sync()};window.addEventListener('storage',storage);return()=>window.removeEventListener('storage',storage)},[]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem('aurealis-cart',JSON.stringify(cart))}catch{}},[cart,loaded]);
 return {cart,setCart};
}
