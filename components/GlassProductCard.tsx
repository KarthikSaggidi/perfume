'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Check,Heart,ShoppingBag,Star} from 'lucide-react';
import {type BottleSize,type Product,money,productPrice} from '@/lib/products';
import {useCommerce} from './ProductCommerce';
import ReferenceImage from './ReferenceImage';
export default function GlassProductCard({product:p}:{product:Product}){
 const {add}=useCommerce();const [size,setSize]=useState<BottleSize>(50),[saved,setSaved]=useState(false),[added,setAdded]=useState(false);
 useEffect(()=>{const sync=()=>{try{setSaved(JSON.parse(localStorage.getItem('aurealis-wishlist')||'[]').includes(p.id))}catch{}};sync();window.addEventListener('aurealis-wishlist-change',sync);return()=>window.removeEventListener('aurealis-wishlist-change',sync)},[p.id]);
 useEffect(()=>{if(!added)return;const timer=setTimeout(()=>setAdded(false),1800);return()=>clearTimeout(timer)},[added]);
 const toggle=()=>{try{const value=JSON.parse(localStorage.getItem('aurealis-wishlist')||'[]');const list:string[]=Array.isArray(value)?value:[];localStorage.setItem('aurealis-wishlist',JSON.stringify(saved?list.filter(id=>id!==p.id):[...new Set([...list,p.id])]));window.dispatchEvent(new Event('aurealis-wishlist-change'))}catch{setSaved(s=>!s)}};
 const buy=()=>{add(p.id,1,size);setAdded(true)};
 return <article className="glass-product-card velora-product-card"><div className="glass-product-art"><Link href={`/products/${p.id}`} aria-label={`Discover ${p.name}`}><ReferenceImage region={p.id} alt={`${p.name} by Velora`}/></Link>{p.badge&&<span className="velora-product-badge">{p.badge}</span>}<button className="velora-card-heart" aria-label={`${saved?'Remove':'Save'} ${p.name} ${saved?'from':'to'} wishlist`} aria-pressed={saved} onClick={toggle}><Heart size={20} strokeWidth={1.5} fill={saved?'currentColor':'none'}/></button></div><div className="glass-product-body"><Link href={`/products/${p.id}`}><h3>{p.name}</h3></Link><p>{p.family}</p><div className="velora-card-rating" title="Illustrative rating from the design reference" aria-label={`${p.rating} out of 5, illustrative collection rating`}><span>{Array.from({length:5},(_,i)=><Star size={11} key={i} fill={i<4?'currentColor':'none'} strokeWidth={1.25}/>)}</span><small>{p.rating} ({p.reviews})</small></div><strong>{money(productPrice(p,size))}</strong><div className="velora-card-controls"><div className="velora-card-sizes" role="group" aria-label={`${p.name} bottle size`}>{([50,100] as const).map(s=><button key={s} aria-pressed={size===s} onClick={()=>setSize(s)}>{s}ml</button>)}</div><button className="velora-card-bag" onClick={buy} aria-label={`Add ${p.name} ${size}ml to bag`}>{added?<Check size={16}/>:<ShoppingBag size={16}/>}</button><button className="velora-card-add" onClick={buy}>{added?'Added to Cart':'Add to Cart'}</button></div></div></article>;
}
