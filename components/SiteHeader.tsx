'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {Heart,Menu,Search,ShoppingBag,UserRound,X} from 'lucide-react';
export const navigation=[['Home','/'],['Shop','/shop'],['Collections','/collections'],['Discover','/discover'],['About','/about']];
export function BrandWordmark(){return <span className="brand-type">VELORA<small>FRAGRANCES</small></span>}
export default function SiteHeader({count,onSearch,onWishlist,onAccount,onBag}:{count:number;onSearch:()=>void;onWishlist:()=>void;onAccount:()=>void;onBag:()=>void}){
 const path=usePathname();
 const [mobile,setMobile]=useState(false);
 const menuRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!mobile)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMobile(false);menuRef.current?.focus()}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[mobile]);
 return <><header className="velora-header"><button ref={menuRef} className="velora-menu-button" aria-controls="main-mobile-menu" onClick={()=>setMobile(s=>!s)} aria-label={mobile?'Close menu':'Open menu'} aria-expanded={mobile}>{mobile?<X size={22}/>:<Menu size={22}/>}</button><Link href="/" className="velora-wordmark" aria-label="Velora home"><BrandWordmark/></Link><nav className="velora-desktop-nav" aria-label="Main navigation">{navigation.map(([label,url])=><Link key={url} href={url} aria-current={path===url||(url!=='/'&&path.startsWith(url+'/'))||(url==='/shop'&&path.startsWith('/products'))?'page':undefined}>{label}</Link>)}</nav><div className="velora-header-actions"><button className="velora-search" onClick={onSearch} aria-label="Search fragrances"><Search size={19} strokeWidth={1.5}/><span>Search perfumes, notes, collections...</span></button><button className="velora-account" onClick={onAccount} aria-label="Account information"><UserRound size={24} strokeWidth={1.4}/></button><button className="velora-wishlist" onClick={onWishlist} aria-label="Open wishlist"><Heart size={24} strokeWidth={1.4}/></button><button className="velora-bag" onClick={onBag} aria-label={`Open bag, ${count} items`}><ShoppingBag size={25} strokeWidth={1.4}/>{count>0&&<b>{count}</b>}</button></div></header>{mobile&&<nav id="main-mobile-menu" className="velora-mobile-menu" aria-label="Mobile navigation">{navigation.map(([label,url])=><Link href={url} key={url} onClick={()=>setMobile(false)}>{label}</Link>)}<div><button onClick={()=>{setMobile(false);onWishlist()}}>Wishlist <Heart size={17}/></button><button onClick={()=>{setMobile(false);onAccount()}}>Account <UserRound size={17}/></button></div></nav>}</>;
}
