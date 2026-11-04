'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Check,Heart,ShoppingBag,Star} from 'lucide-react';
import {type BottleSize,type Product,money,productPrice,baseProductPrice} from '@/lib/products';
import {useCommerce} from './ProductCommerce';
import ReferenceImage from './ReferenceImage';
import {useWishlist} from '@/lib/use-wishlist';
export default function GlassProductCard({product:p}:{product:Product}){
 const {add}=useCommerce();const {saved,saving,error,toggle,ready}=useWishlist(p.id);const outOfStock=p.stock!==undefined&&p.stock<1;const [size,setSize]=useState<BottleSize>(50),[added,setAdded]=useState(false);
 useEffect(()=>{if(!added)return;const timer=setTimeout(()=>setAdded(false),1800);return()=>clearTimeout(timer)},[added]);

 const buy=()=>{if(add(p.id,1,size))setAdded(true)};
 return <article className="glass-product-card velora-product-card"><div className="glass-product-art"><Link href={`/products/${p.id}`} aria-label={`Discover ${p.name}`}><ReferenceImage region={p.id} image={p.image} alt={`${p.name} by Velora`}/></Link>{p.offer&&<span className="festival-product-ribbon">DIWALI · {p.offer.percent}% OFF</span>}{p.badge&&!p.offer&&<span className="velora-product-badge">{p.badge}</span>}<button className="velora-card-heart" aria-label={`${saved?'Remove':'Save'} ${p.name} ${saved?'from':'to'} wishlist`} aria-pressed={saved} disabled={saving||!ready} onClick={()=>void toggle()}><Heart size={20} strokeWidth={1.5} fill={saved?'currentColor':'none'}/></button></div><div className="glass-product-body"><Link href={`/products/${p.id}`}><h3>{p.name}</h3></Link><p>{p.family}</p>{p.rating>0?<div className="velora-card-rating" title="Illustrative rating from the design reference" aria-label={`${p.rating} out of 5, illustrative collection rating`}><span>{Array.from({length:5},(_,i)=><Star size={11} key={i} fill={i<4?'currentColor':'none'} strokeWidth={1.25}/>)}</span><small>{p.rating} ({p.reviews})</small></div>:<div className="velora-card-rating"><small>New discovery</small></div>}<div className="festival-card-price">{p.offer&&<del>{money(baseProductPrice(p,size))}</del>}<strong>{money(productPrice(p,size))}</strong></div><div className="velora-card-controls"><div className="velora-card-sizes" role="group" aria-label={`${p.name} bottle size`}>{([50,100] as const).map(s=><button key={s} aria-pressed={size===s} onClick={()=>setSize(s)}>{s}ml</button>)}</div><button className="velora-card-bag" disabled={outOfStock||!ready} onClick={buy} aria-label={`Add ${p.name} ${size}ml to bag`}>{added?<Check size={16}/>:<ShoppingBag size={16}/>}</button><button className="velora-card-add" disabled={outOfStock||!ready} onClick={buy}>{outOfStock?'Sold Out':added?'Added to Cart':'Add to Cart'}</button></div>{error&&<p className="wishlist-error" role="alert">{error}</p>}</div></article>;
}
