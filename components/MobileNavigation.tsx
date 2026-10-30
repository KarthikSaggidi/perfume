'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Compass,Grid2X2,House,ShoppingBag,UserRound} from 'lucide-react';

export default function MobileNavigation({onAccount}:{onAccount:()=>void}){
  const path=usePathname();
  const links=[{title:'Home',href:'/',Icon:House},{title:'Shop',href:'/shop',Icon:ShoppingBag},{title:'Collections',href:'/collections',Icon:Grid2X2},{title:'Discover',href:'/discover',Icon:Compass}];
  return <nav className="luxury-mobile-navigation" aria-label="Mobile main navigation">{links.map(({title,href,Icon})=>{const active=href==='/'?path==='/':path.startsWith(href)||(href==='/shop'&&path.startsWith('/products'));return <Link href={href} key={href} aria-current={active?'page':undefined}><span><Icon size={21} strokeWidth={1.45}/></span>{title}</Link>})}<button onClick={onAccount}><span><UserRound size={21} strokeWidth={1.45}/></span>Account</button></nav>;
}
