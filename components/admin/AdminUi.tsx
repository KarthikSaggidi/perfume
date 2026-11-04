'use client';

/* eslint-disable @next/next/no-img-element -- Admin previews accept trusted uploaded or HTTPS media URLs outside the storefront image allowlist. */

import {Children,cloneElement,isValidElement,useEffect,useId,useRef,useState,type ReactElement,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {AlertCircle,ArrowUpRight,Check,ChevronLeft,ChevronRight,ImagePlus,LoaderCircle,Package,Search,Upload,X} from 'lucide-react';

export type Notice=(message:string,tone?:'success'|'error')=>void;
export type Mutate=(path:string,method:'POST'|'PATCH'|'DELETE',body?:unknown)=>Promise<boolean>;
export const currency=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
export const date=(value:string,withTime=false)=>value?new Date(value).toLocaleString('en-IN',withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}):'—';
export const human=(value:string)=>value.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export const initials=(name:string)=>name.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase()||'V';
export const parseList=(value:string)=>[...new Set(value.split(',').map(item=>item.trim()).filter(Boolean))];


const productImageFallbacks:Record<string,string>={noir:'/images/velora-noir.webp',flora:'/images/velora-celeste.webp',ocean:'/images/velora-portrait.webp',velvet:'/images/velora-bloom.webp',amber:'/images/velora-oud.webp'};
export function AdminProductImage({productId,image,alt='',eager=false}:{productId:string;image?:string;alt?:string;eager?:boolean}){
  const [failed,setFailed]=useState<string[]>([]);
  const candidates=[image,productImageFallbacks[productId]].filter((value):value is string=>Boolean(value));
  const source=candidates.find(value=>!failed.includes(value));
  return source?<img loading={eager?'eager':'lazy'} decoding="async" src={source} alt={alt} onError={()=>setFailed(current=>current.includes(source)?current:[...current,source])}/>:<Package size={20} aria-hidden="true"/>;
}

export function Status({value}:{value:string}){return <span className={`admin-status admin-status-${value}`}>{human(value)}</span>}
export function Field({label,children,hint,wide=false}:{label:string;children:ReactNode;hint?:string;wide?:boolean}){
  const id=useId(),labelId=`${id}-label`,hintId=`${id}-hint`;
  const controls=Children.map(children,child=>{
    if(!isValidElement(child)||typeof child.type!=='string'||!['input','select','textarea'].includes(child.type))return child;
    const control=child as ReactElement<{id?:string;'aria-labelledby'?:string;'aria-describedby'?:string}>;
    const description=[control.props['aria-describedby'],hint?hintId:undefined].filter(Boolean).join(' ')||undefined;
    return cloneElement(control,{'aria-labelledby':labelId,'aria-describedby':description});
  });
  return <label className={`admin-field ${wide?'admin-field-wide':''}`}><span id={labelId}>{label}</span>{controls}{hint&&<small id={hintId}>{hint}</small>}</label>;
}
export function Toggle({label,description,checked,onChange,disabled=false}:{label:string;description?:string;checked:boolean;onChange:(value:boolean)=>void;disabled?:boolean}){return <label className="admin-toggle"><span><strong>{label}</strong>{description&&<small>{description}</small>}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/><i aria-hidden="true"/></label>}
export function SearchField({value,onChange,placeholder='Search…'}:{value:string;onChange:(value:string)=>void;placeholder?:string}){return <label className="admin-search"><Search size={17}/><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/>{value&&<button type="button" aria-label="Clear search" onClick={()=>onChange('')}><X size={15}/></button>}</label>}
export function EmptyState({icon,heading,description,action}:{icon:ReactNode;heading:string;description:string;action?:ReactNode}){return <div className="admin-empty"><span>{icon}</span><h3>{heading}</h3><p>{description}</p>{action}</div>}
export function PanelHeader({title,description,actions}:{title:string;description?:string;actions?:ReactNode}){return <div className="admin-section-heading"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{actions&&<div className="admin-heading-actions">{actions}</div>}</div>}
export function SaveButton({busy,disabled=false,children='Save changes'}:{busy:boolean;disabled?:boolean;children?:ReactNode}){return <button className="admin-button admin-button-primary" type="submit" disabled={busy||disabled}>{busy?<LoaderCircle size={16} className="admin-spin"/>:<Check size={16}/>} {busy?'Saving…':children}</button>}
export function Dialog({title,description,children,onClose,wide=false,busy=false}:{title:string;description?:string;children:ReactNode;onClose:()=>void;wide?:boolean;busy?:boolean}){
  const root=useRef<HTMLDivElement>(null),heading=useId();
  const callbacks=useRef({busy,onClose});callbacks.current={busy,onClose};
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const first=root.current?.querySelector<HTMLElement>('input:not([type="hidden"]),select,textarea');
    (first||root.current)?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){e.preventDefault();if(!callbacks.current.busy)callbacks.current.onClose()}
      if(e.key==='Tab'){
        const controls=Array.from(root.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')||[]).filter(el=>el.getClientRects().length>0);
        if(!controls.length){e.preventDefault();return}
        const firstControl=controls[0],last=controls[controls.length-1];
        if(e.shiftKey&&(document.activeElement===firstControl||document.activeElement===root.current)){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root.current)){e.preventDefault();firstControl.focus()}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus()};
  // Preserve focus while form state changes; the close control also respects pending saves.
  },[]);
  const portalRoot=typeof document==='undefined'?null:document.body;
  return portalRoot?createPortal(<div className="admin-dialog-backdrop" onClick={()=>{if(!callbacks.current.busy)callbacks.current.onClose()}}><div className={`admin-dialog ${wide?'admin-dialog-wide':''}`} role="dialog" aria-modal="true" aria-labelledby={heading} tabIndex={-1} ref={root} onClick={e=>e.stopPropagation()}><div className="admin-dialog-heading"><div><h2 id={heading}>{title}</h2>{description&&<p>{description}</p>}</div><button className="admin-icon-button" type="button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={21}/></button></div>{children}</div></div>,portalRoot):null;
}
export function ImageField({label,value,onChange,notify,onUploading,required=false}:{label:string;value:string;onChange:(url:string)=>void;notify:Notice;onUploading?:(uploading:boolean)=>void;required?:boolean}){
  const [uploading,setUploading]=useState(false);
  const file=useRef<HTMLInputElement>(null);
  const upload=async(selected:File|undefined)=>{
    if(!selected)return;
    if(!['image/jpeg','image/png','image/webp'].includes(selected.type)){notify('Choose a JPEG, PNG, or WebP image.','error');return}
    if(selected.size>2000000){notify('Choose an image smaller than 2 MB.','error');return}
    setUploading(true);onUploading?.(true);
    try{
      const body=new FormData();body.append('file',selected);
      const response=await fetch('/api/admin/media',{method:'POST',body});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'The image could not be uploaded.');
      onChange(result.url);notify('Image uploaded. Save the editor to apply it.');
    }catch(error){notify(error instanceof Error?error.message:'The image could not be uploaded.','error')}
    finally{setUploading(false);onUploading?.(false);if(file.current)file.current.value=''}
  };
  const safeValue=(value.startsWith('/')&&!value.startsWith('//'))||/^https:\/\//i.test(value)?value:'';
  return <div className="admin-image-field"><Field label={label} hint="Upload an image or enter a relative path or HTTPS image URL."><input required={required} value={value} onChange={e=>onChange(e.target.value)} placeholder="/images/campaign.webp" maxLength={1500}/></Field><div className="admin-image-upload">{safeValue?<div className="admin-image-preview"><img loading="lazy" decoding="async" src={safeValue} alt={`${label} preview`}/><a href={safeValue} target="_blank" rel="noreferrer" aria-label={`Open ${label} preview`}><ArrowUpRight size={15}/></a></div>:<span className="admin-image-placeholder"><ImagePlus size={27}/></span>}<div><input ref={file} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void upload(e.target.files?.[0])} hidden/><button type="button" className="admin-button admin-button-secondary" disabled={uploading} onClick={()=>file.current?.click()}>{uploading?<LoaderCircle className="admin-spin" size={16}/>:<Upload size={16}/>} {uploading?'Uploading…':'Upload image'}</button><small>JPG, PNG or WebP · Up to 2 MB</small></div></div></div>;
}
export function ErrorMessage({message}:{message:string}){return <div className="admin-error" role="alert"><AlertCircle size={18}/><span>{message}</span></div>}

export function Pagination({page,total,pageSize=10,onChange,label='records'}:{page:number;total:number;pageSize?:number;onChange:(page:number)=>void;label?:string}){const pages=Math.max(1,Math.ceil(total/pageSize)),current=Math.max(1,Math.min(page,pages));return <nav className="admin-pagination" aria-label={`${label} pagination`}><span>{total?`${(current-1)*pageSize+1}–${Math.min(current*pageSize,total)} of ${total} ${label}`:`No ${label}`}</span>{total>0&&<div><button type="button" aria-label={`Previous ${label} page`} disabled={current<=1} onClick={()=>onChange(current-1)}><ChevronLeft size={16}/></button><span>Page {current} of {pages}</span><button type="button" aria-label={`Next ${label} page`} disabled={current>=pages} onClick={()=>onChange(current+1)}><ChevronRight size={16}/></button></div>}</nav>}
