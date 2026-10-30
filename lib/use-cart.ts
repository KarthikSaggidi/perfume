'use client';
import {useEffect,useState} from 'react';
import {cartItems} from './products';
export function useCart(){
 const [cart,setCart]=useState<Record<string,number>>({});
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{try{const value=JSON.parse(localStorage.getItem('aurealis-cart')||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))setCart(Object.fromEntries(cartItems(value).map(item=>[item.key,item.quantity])))}catch{}setLoaded(true)},[]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem('aurealis-cart',JSON.stringify(cart))}catch{}},[cart,loaded]);
 return {cart,setCart};
}
