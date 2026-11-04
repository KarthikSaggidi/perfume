'use client';

import {useMemo,useState} from 'react';
import {ArrowUpRight,Image,LayoutDashboard,Package,Search,Settings2,ShoppingBag,Users} from 'lucide-react';
import type {AdminBootstrap} from '@/lib/commerce-types';
import {AdminProductImage,Dialog,currency} from './AdminUi';

type Result={key:string;section:string;id?:string;title:string;detail:string;kind:string;image?:string};
export default function WorkspaceSearch({data,onOpen,onClose}:{data:AdminBootstrap;onOpen:(section:string,id?:string)=>void;onClose:()=>void}){
 const [query,setQuery]=useState(''),[active,setActive]=useState(0);
 const manage=data.admin.role!=='support';
 const results=useMemo(()=>{
  const needle=query.trim().toLocaleLowerCase();
  const matches=(...values:string[])=>values.join(' ').toLocaleLowerCase().includes(needle);
  const items:Result[]=[];
  if(!needle)return [
   {key:'overview',section:'overview',title:'Store overview',detail:'Payments, orders and inventory',kind:'Workspace'},
   {key:'orders',section:'orders',title:'Manage orders',detail:'Fulfilment, payment and delivery',kind:'Workspace'},
   {key:'customers',section:'customers',title:'Customer directory',detail:'Profiles, order history and notes',kind:'Workspace'},
   ...(manage?[{key:'new-product',section:'products',id:'__new',title:'Add a product',detail:'Create a new fragrance',kind:'Quick action'},{key:'new-campaign',section:'posters',id:'__new',title:'Create a campaign',detail:'Update your storefront imagery',kind:'Quick action'}]:[]),
  ];
  if(manage)items.push(...data.products.filter(product=>matches(product.name,product.sku,product.family)).slice(0,5).map(product=>({key:'product-'+product.id,section:'products',id:product.id,title:product.name,detail:`${product.sku} · ${product.stock} in stock · ${currency(product.price)}`,kind:'Product',image:product.image})));
  items.push(...data.orders.filter(order=>matches(order.number,order.customerName,order.phone,order.email,order.trackingNumber)).slice(0,5).map(order=>({key:'order-'+order.id,section:'orders',id:order.id,title:order.number,detail:`${order.customerName||order.phone} · ${currency(order.total)} · ${order.status}`,kind:'Order'})));
  items.push(...data.customers.filter(customer=>matches(customer.name,customer.phone,customer.email,...customer.tags)).slice(0,5).map(customer=>({key:'customer-'+customer.id,section:'customers',id:customer.id,title:customer.name||customer.phone,detail:customer.name?customer.phone:customer.email||'Customer profile',kind:'Customer'})));
  items.push(...(data.leads||[]).filter(lead=>matches(lead.name,lead.phone,lead.email)).slice(0,5).map(lead=>({key:'lead-'+lead.id,section:'leads',id:lead.id,title:lead.name,detail:lead.phone+' · '+lead.status,kind:'Offer lead'})));
  if(manage)items.push(...data.posters.filter(poster=>matches(poster.name,poster.title)).slice(0,3).map(poster=>({key:'poster-'+poster.id,section:'posters',id:poster.id,title:poster.name,detail:poster.active?'Enabled campaign':'Inactive campaign',kind:'Campaign'})));
  if(manage&&matches('settings','shipping','tax','sms','store'))items.push({key:'settings',section:'settings',title:'Store settings',detail:'Delivery, SMS and store preferences',kind:'Workspace'});
  return items;
 },[data,manage,query]);
 const selected=Math.min(active,Math.max(0,results.length-1));
 const choose=(result:Result)=>{onClose();onOpen(result.section,result.id)};
 return <Dialog title="Search your workspace" description="Find products, orders, customers or a quick action." onClose={onClose}>
  <div className="admin-command-input"><Search size={20}/><input autoComplete="off" aria-label="Search workspace" placeholder="Search by name, SKU, order or phone…" value={query} maxLength={160} onChange={event=>{setQuery(event.target.value);setActive(0)}} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setActive(index=>Math.min(results.length-1,index+1))}else if(event.key==='ArrowUp'){event.preventDefault();setActive(index=>Math.max(0,index-1))}else if(event.key==='Enter'&&results[selected]){event.preventDefault();choose(results[selected])}}}/><kbd>ESC</kbd></div>
  <div className="admin-command-results" aria-label="Workspace search results">{results.length?results.map((result,index)=>{const Icon=result.section==='orders'?ShoppingBag:result.section==='customers'?Users:result.section==='posters'?Image:result.section==='settings'?Settings2:result.section==='overview'?LayoutDashboard:Package;return <button key={result.key} className={selected===index?'is-selected':''} onPointerMove={()=>setActive(index)} onClick={()=>choose(result)}><span className="admin-command-icon">{result.image?<AdminProductImage productId={result.id||''} image={result.image}/>:<Icon size={19}/>}</span><span><small>{result.kind}</small><strong>{result.title}</strong><em>{result.detail}</em></span><ArrowUpRight size={16}/></button>}):<div className="admin-command-empty"><Search size={25}/><strong>No matching records</strong><p>Try a different product name, order number or mobile number.</p></div>}</div>
  <div className="admin-command-footer"><span>↑ ↓ to navigate</span><span>Enter to open</span><span>{results.length} results</span></div>
 </Dialog>;
}
