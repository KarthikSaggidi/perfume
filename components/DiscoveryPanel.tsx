'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Check,Clock3,Compass,Heart,HelpCircle,Search,ShoppingBag,Sparkles,UserRound,X} from 'lucide-react';
import {products,money} from '@/lib/products';
import ReferenceImage from './ReferenceImage';
import {useCommerce} from './ProductCommerce';

type PanelMode='search'|'wishlist'|'account';
const popularSearches=['Floral','Oud','Fresh','Vanilla','Rose'];
const validIds=new Set(products.map(p=>p.id));

function readWishlist():string[]{
  try{
    const value:unknown=JSON.parse(localStorage.getItem('aurealis-wishlist')||'[]');
    return Array.isArray(value)?value.filter((id):id is string=>typeof id==='string'&&validIds.has(id)):[];
  }catch{return []}
}

export default function DiscoveryPanel({mode,close}:{mode:PanelMode;close:()=>void}){
  const [view,setView]=useState<PanelMode>(mode);
  const [query,setQuery]=useState('');
  const [saved,setSaved]=useState<string[]>([]);
  const [recent,setRecent]=useState<string[]>([]);
  const [addedId,setAddedId]=useState<string|null>(null);
  const root=useRef<HTMLDivElement>(null);
  const searchInput=useRef<HTMLInputElement>(null);
  const {add,cart}=useCommerce();
  const bagCount=Object.values(cart).reduce((sum,qty)=>sum+qty,0);

  useEffect(()=>{
    const sync=()=>setSaved(readWishlist());
    sync();
    try{
      const value:unknown=JSON.parse(localStorage.getItem('aurealis-recent-searches')||'[]');
      if(Array.isArray(value))setRecent(value.filter((q):q is string=>typeof q==='string'&&q.trim().length>0).slice(0,4));
    }catch{}
    window.addEventListener('aurealis-wishlist-change',sync);
    return()=>window.removeEventListener('aurealis-wishlist-change',sync);
  },[]);

  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    (searchInput.current||root.current)?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape')close();
      if(e.key==='Tab'){
        const controls=root.current?.querySelectorAll<HTMLElement>('input:not([disabled]),button:not([disabled]),a[href]');
        if(!controls?.length)return;
        const first=controls[0],last=controls[controls.length-1];
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){
          e.preventDefault();last.focus();
        }else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root.current)){
          e.preventDefault();first.focus();
        }
      }
    };
    document.addEventListener('keydown',key);
    return()=>{
      document.body.style.overflow=previousOverflow;
      document.removeEventListener('keydown',key);
      if(previous?.isConnected)previous.focus();
    };
  },[close]);

  useEffect(()=>{
    (view==='search'?searchInput.current:root.current)?.focus();
  },[view]);

  useEffect(()=>{
    if(!addedId)return;
    const timeout=setTimeout(()=>setAddedId(null),1800);
    return()=>clearTimeout(timeout);
  },[addedId]);

  const rememberSearch=(value:string)=>{
    const term=value.trim().slice(0,80);
    if(!term)return;
    const next=[term,...recent.filter(item=>item.toLowerCase()!==term.toLowerCase())].slice(0,4);
    setRecent(next);
    try{localStorage.setItem('aurealis-recent-searches',JSON.stringify(next))}catch{}
  };
  const removeRecent=(value:string)=>{
    const next=recent.filter(item=>item!==value);
    setRecent(next);
    try{localStorage.setItem('aurealis-recent-searches',JSON.stringify(next))}catch{}
  };
  const removeFavourite=(id:string)=>{
    const next=saved.filter(value=>value!==id);
    setSaved(next);
    try{
      localStorage.setItem('aurealis-wishlist',JSON.stringify(next));
      window.dispatchEvent(new Event('aurealis-wishlist-change'));
    }catch{}
  };
  const list=products.filter(p=>view==='wishlist'?saved.includes(p.id):`${p.name} ${p.family} ${p.notes}`.toLowerCase().includes(query.trim().toLowerCase()));
  const title=view==='search'?'Find your signature':view==='wishlist'?'Your favourites':'Your Velora';

  return <div className="overlay" onClick={close}>
    <div className={`drawer glass-discovery discovery-${view}`} role="dialog" aria-modal="true" aria-labelledby="discovery-title" tabIndex={-1} ref={root} onClick={e=>e.stopPropagation()}>
      <div className="drawer-heading"><div>{view!==mode&&<button className="discovery-back" onClick={()=>setView(mode)} aria-label="Back to your Velora"><ArrowLeft size={16}/></button>}<p className="eyebrow">A LITTLE MORE YOU</p><h2 id="discovery-title">{title}</h2></div><button aria-label="Close panel" onClick={close}><X size={23}/></button></div>
      {view==='account'?<div className="glass-account">
        <span className="account-monogram"><UserRound size={30} strokeWidth={1.1}/></span>
        <p className="eyebrow">YOUR PERSONAL DISCOVERY</p>
        <h3>A collection that feels like you.</h3>
        <p>Your favourite scents and your next discovery, all in one place.</p>
        <div className="account-collection-summary"><span><strong>{saved.length.toString().padStart(2,'0')}</strong>Saved favourites</span><span><strong>{bagCount.toString().padStart(2,'0')}</strong>In your bag</span></div>
        <nav className="account-links" aria-label="Your Velora collection">
          <button onClick={()=>setView('wishlist')}><Heart size={19}/><span>Your favourites</span><ArrowRight size={16}/></button>
          <Link href="/checkout" onClick={close}><ShoppingBag size={19}/><span>Review your collection</span><ArrowRight size={16}/></Link>
          <Link href="/discover" onClick={close}><Compass size={19}/><span>The sensory experience</span><ArrowRight size={16}/></Link>
          <Link href="/help" onClick={close}><HelpCircle size={19}/><span>A little guidance</span><ArrowRight size={16}/></Link>
        </nav>
        <div className="account-preview-note"><Sparkles size={17}/><p>Your bag and favourites stay on this device. Sign-in, order history, and payments are not connected in this preview.</p></div>
        <Link href="/shop" className="account-explore" onClick={close}>Find your next fragrance <ArrowRight size={16}/></Link>
      </div>:<>
        {view==='search'&&<>
          <form className="discovery-search-form" onSubmit={e=>{e.preventDefault();rememberSearch(query)}}><label className="search-field"><Search size={19}/><input ref={searchInput} value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search by scent, notes or family" placeholder="A fragrance, a note, a feeling…" maxLength={80}/>{query&&<button type="button" aria-label="Clear search" onClick={()=>{setQuery('');searchInput.current?.focus()}}><X size={16}/></button>}</label></form>
          {!query.trim()&&<div className="discovery-search-inspiration"><p className="discovery-small-heading">A little inspiration</p><div className="discovery-search-chips">{popularSearches.map(term=><button key={term} onClick={()=>{setQuery(term);rememberSearch(term)}}>{term}</button>)}</div>{recent.length>0&&<div className="discovery-recent"><p className="discovery-small-heading">Recent discoveries</p>{recent.map(term=><div key={term}><button onClick={()=>setQuery(term)}><Clock3 size={14}/>{term}</button><button onClick={()=>removeRecent(term)} aria-label={`Remove ${term} from recent searches`}><X size={13}/></button></div>)}</div>}</div>}
        </>}
        <div className="discovery-results-heading"><p className="eyebrow">{view==='wishlist'?'SAVED FOR ANOTHER MOMENT':query.trim()?'YOUR DISCOVERIES':'EXPLORE THE COLLECTION'}</p><span role="status" aria-live="polite">{list.length} {list.length===1?'fragrance':'fragrances'}</span></div>
        <div className="discovery-results">{list.map(p=><div className="discovery-item" key={p.id}>
          <Link href={`/products/${p.id}`} onClick={()=>{if(view==='search')rememberSearch(query);close()}} aria-label={`Discover ${p.name}`}><ReferenceImage region={p.id} alt={`${p.name} eau de parfum`}/></Link>
          <div><Link href={`/products/${p.id}`} onClick={()=>{if(view==='search')rememberSearch(query);close()}}><h3>{p.name}</h3></Link><p>{p.family} · 50 ml</p><strong>{money(p.price)}</strong><button className="discovery-add" onClick={()=>{add(p.id);setAddedId(p.id)}} aria-label={addedId===p.id?`${p.name} added to bag`:`Add ${p.name} to bag`}>{addedId===p.id?'Added to bag':'Add to bag'}{addedId===p.id?<Check size={13}/>:<ArrowRight size={13}/>}</button></div>
          {view==='wishlist'&&<button className="discovery-remove" onClick={()=>removeFavourite(p.id)} aria-label={`Remove ${p.name} from wishlist`}><Heart size={17} fill="currentColor"/></button>}
        </div>)}</div>
        {!list.length&&<div className="empty">{view==='wishlist'?<Heart size={32} strokeWidth={1.2}/>:<Search size={32} strokeWidth={1.2}/>}<h3>{view==='wishlist'?'Your favourites begin here.':'A new discovery awaits.'}</h3><p>{view==='wishlist'?'A scent catches your eye? Tap its heart to save it here.':'No fragrances match that search. Try a note like rose, oud, or amber.'}</p>{view==='search'?<button className="discovery-reset" onClick={()=>setQuery('')}>Explore all fragrances <ArrowRight size={15}/></button>:<Link href="/shop" onClick={close}>Find your signature <ArrowRight size={15}/></Link>}</div>}
        {view==='wishlist'&&list.length>0&&<p className="discovery-storage-note">A little collection, saved on this device.</p>}
      </>}
    </div>
  </div>;
}
