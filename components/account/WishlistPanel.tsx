'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {ArrowRight,Heart,LoaderCircle,RefreshCw,Trash2} from 'lucide-react';
import type {PublicCatalog,PublicCustomer,StoreProduct} from '@/lib/commerce-types';
import {money,productPrice} from '@/lib/products';
import {accountError,accountRequest} from './api';

export default function WishlistPanel({user,onRefresh}:{user:PublicCustomer;onRefresh:()=>Promise<void>}){
  const [products,setProducts]=useState<StoreProduct[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState<string|null>(null);
  const load=useCallback(async(signal?:AbortSignal)=>{setLoading(true);try{const result=await accountRequest<PublicCatalog>('/api/catalog',{signal});setProducts(result.products);setError('')}catch(e){if(!signal?.aborted)setError(accountError(e))}finally{if(!signal?.aborted)setLoading(false)}},[]);
  useEffect(()=>{if(!user.wishlist.length){setLoading(false);return}const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load,user.wishlist.length]);
  const remove=async(productId:string)=>{setBusy(productId);setError('');try{await accountRequest('/api/account/wishlist',{method:'POST',body:JSON.stringify({productId,saved:false})});await onRefresh()}catch(e){setError(accountError(e))}finally{setBusy(null)}};
  return <div className="account-wishlist"><div className="account-section-intro"><div><p className="account-eyebrow">THE ONES THAT STAY WITH YOU</p><h2 id="account-section-title">Your favourites.</h2><p>A personal edit of the fragrances you love.</p></div><span className="account-section-count">{user.wishlist.length} saved</span></div>
    {error&&<p className="account-error" role="alert">{error}<button className="account-text-button" onClick={()=>void load()}><RefreshCw size={13}/> Try again</button></p>}
    {!user.wishlist.length?<div className="account-empty-state account-panel"><Heart size={32} strokeWidth={1.15}/><h3>A little love goes a long way.</h3><p>Tap the heart on any fragrance to bring it into your personal collection.</p><Link className="account-secondary-button" href="/shop">Find your next favourite <ArrowRight size={15}/></Link></div>:loading?<div className="account-list-loading" role="status"><LoaderCircle className="account-spinner" size={22}/> Opening your favourites…</div>:<div className="account-wishlist-grid">{user.wishlist.map(id=>{const product=products.find(p=>p.id===id);return <article className="account-wishlist-card account-panel" key={id}>{product?<><Link className="account-wishlist-image" href={`/products/${encodeURIComponent(id)}`}>{product.image?<Image src={product.image} alt={`${product.name} eau de parfum`} fill sizes="(max-width:600px) 46vw, 260px" unoptimized style={{objectFit:'cover'}}/>:<Heart size={30} strokeWidth={1}/>}</Link><div className="account-wishlist-copy"><Link href={`/products/${encodeURIComponent(id)}`}><h3>{product.name}</h3></Link><p>{product.family}</p><strong>{money(productPrice(product))}</strong><Link href={`/products/${encodeURIComponent(id)}`}>Discover fragrance <ArrowRight size={13}/></Link></div></>:<div className="account-wishlist-unavailable"><Heart size={26} strokeWidth={1}/><h3>A saved memory.</h3><p>This fragrance is no longer available in the current collection.</p></div>}<button className="account-wishlist-remove" aria-label={`Remove ${product?.name||'unavailable fragrance'} from wishlist`} disabled={busy===id} onClick={()=>void remove(id)}>{busy===id?<LoaderCircle size={17} className="account-spinner"/>:<Trash2 size={17}/>}</button></article>})}</div>}
  </div>;
}
