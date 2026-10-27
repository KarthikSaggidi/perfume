'use client';
import { useEffect, useState } from 'react';
import { products } from './products';
export function useCart() {
 const [cart,setCart]=useState<Record<string,number>>({});
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('aurealis-cart')||'{}');const valid:Record<string,number>={};products.forEach(p=>{if(Number.isInteger(saved[p.id])&&saved[p.id]>0)valid[p.id]=saved[p.id]});setCart(valid)}catch{}setLoaded(true)},[]);
 useEffect(()=>{if(loaded)localStorage.setItem('aurealis-cart',JSON.stringify(cart))},[cart,loaded]);
 return {cart,setCart};
}
