'use client';

import {useEffect,useRef,useState} from 'react';
import {Check,MapPin,Pencil,Plus,Trash2,X} from 'lucide-react';
import type {Address,PublicCustomer} from '@/lib/commerce-types';
import {accountError,accountRequest} from './api';

type AddressDraft=Omit<Address,'id'>;
const emptyAddress=(user:PublicCustomer):AddressDraft=>({label:'Home',name:user.name,phone:user.phone,line1:'',line2:'',city:'',state:'',postalCode:'',country:'India',isDefault:!user.addresses.length});
export default function AddressBook({user,onRefresh}:{user:PublicCustomer;onRefresh:()=>Promise<void>}){
  const [editing,setEditing]=useState<string|null>(null),[draft,setDraft]=useState<AddressDraft>(emptyAddress(user)),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[deleting,setDeleting]=useState<string|null>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(editing)heading.current?.focus()},[editing]);
  const begin=(address?:Address)=>{setDraft(address?{label:address.label,name:address.name,phone:address.phone,line1:address.line1,line2:address.line2,city:address.city,state:address.state,postalCode:address.postalCode,country:address.country,isDefault:address.isDefault}:emptyAddress(user));setEditing(address?.id||'new');setError('');setNotice('');setDeleting(null)};
  const save=async()=>{
    setBusy(true);setError('');setNotice('');
    try{await accountRequest(editing==='new'?'/api/account/addresses':`/api/account/addresses/${encodeURIComponent(editing!)}`,{method:editing==='new'?'POST':'PATCH',body:JSON.stringify(draft)});await onRefresh();setEditing(null);setNotice('Your address has been saved.')}catch(e){setError(accountError(e))}finally{setBusy(false)}
  };
  const remove=async(address:Address)=>{
    setBusy(true);setError('');setNotice('');
    try{await accountRequest(`/api/account/addresses/${encodeURIComponent(address.id)}`,{method:'DELETE'});await onRefresh();setDeleting(null);setNotice('Address removed.')}catch(e){setError(accountError(e))}finally{setBusy(false)}
  };
  const makeDefault=async(address:Address)=>{
    setBusy(true);setError('');setNotice('');
    try{await accountRequest(`/api/account/addresses/${encodeURIComponent(address.id)}`,{method:'PATCH',body:JSON.stringify({...address,isDefault:true})});await onRefresh();setNotice('Your default address has been updated.')}catch(e){setError(accountError(e))}finally{setBusy(false)}
  };
  return <div className="account-addresses"><div className="account-section-intro"><div><p className="account-eyebrow">A PLACE FOR YOUR NEXT DISCOVERY</p><h2 id="account-section-title">Your address book.</h2><p>Save your delivery details for a smoother checkout.</p></div>{!editing&&<button className="account-secondary-button" onClick={()=>begin()}><Plus size={16}/> Add address</button>}</div>
    {error&&<p className="account-error" role="alert">{error}</p>}{notice&&<p className="account-inline-success" role="status"><Check size={15}/>{notice}</p>}
    {editing?<form className="account-address-form account-panel" onSubmit={e=>{e.preventDefault();void save()}}><div className="account-form-heading"><h3 ref={heading} tabIndex={-1}>{editing==='new'?'A new address.':'Edit your address.'}</h3><button type="button" aria-label="Close address form" disabled={busy} onClick={()=>setEditing(null)}><X size={18}/></button></div><div className="account-form-grid">
      <label className="account-field">Address label<select value={draft.label} onChange={e=>setDraft(d=>({...d,label:e.target.value}))} disabled={busy}><option>Home</option><option>Work</option><option>Other</option></select></label>
      <label className="account-field">Full name<input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} autoComplete="shipping name" maxLength={100} required disabled={busy}/></label>
      <label className="account-field">Mobile number<input value={draft.phone} onChange={e=>setDraft(d=>({...d,phone:e.target.value}))} type="tel" autoComplete="shipping tel" required maxLength={22} disabled={busy}/></label>
      <label className="account-field">Country<select value={draft.country==='IN'?'India':draft.country} onChange={e=>setDraft(d=>({...d,country:e.target.value}))} autoComplete="shipping country-name" disabled={busy}><option>India</option></select></label>
      <label className="account-field account-field-wide">Street address<input value={draft.line1} onChange={e=>setDraft(d=>({...d,line1:e.target.value}))} autoComplete="shipping address-line1" maxLength={200} required disabled={busy}/></label>
      <label className="account-field account-field-wide">Apartment, suite, or landmark <span className="account-optional">(optional)</span><input value={draft.line2} onChange={e=>setDraft(d=>({...d,line2:e.target.value}))} autoComplete="shipping address-line2" maxLength={200} disabled={busy}/></label>
      <label className="account-field">City<input value={draft.city} onChange={e=>setDraft(d=>({...d,city:e.target.value}))} autoComplete="shipping address-level2" maxLength={100} required disabled={busy}/></label>
      <label className="account-field">State / territory<input value={draft.state} onChange={e=>setDraft(d=>({...d,state:e.target.value}))} autoComplete="shipping address-level1" maxLength={100} required disabled={busy}/></label>
      <label className="account-field">PIN code<input value={draft.postalCode} onChange={e=>setDraft(d=>({...d,postalCode:e.target.value.replace(/\D/g,'').slice(0,6)}))} autoComplete="shipping postal-code" inputMode="numeric" pattern="[1-9][0-9]{5}" title="Enter a valid six-digit Indian PIN code." maxLength={6} required disabled={busy}/></label>
    </div><label className="account-checkbox"><input type="checkbox" checked={draft.isDefault} onChange={e=>setDraft(d=>({...d,isDefault:e.target.checked}))} disabled={busy}/> Make this my default delivery address</label><div className="account-form-footer"><button className="account-primary-button" disabled={busy} type="submit">{busy?'Saving…':'Save address'}<Check size={16}/></button><button className="account-text-button" type="button" disabled={busy} onClick={()=>setEditing(null)}>Cancel</button></div></form>:user.addresses.length?<div className="account-address-grid">{user.addresses.map(address=><article className="account-address-card account-panel" key={address.id}><div className="account-address-card-heading"><span><MapPin size={17}/>{address.label||'Address'}</span>{address.isDefault&&<small>DEFAULT</small>}</div><h3>{address.name}</h3><p>{address.line1}{address.line2&&<><br/>{address.line2}</>}<br/>{address.city}, {address.state} {address.postalCode}<br/>{address.country==='IN'?'India':address.country}</p><p className="account-address-phone">{address.phone}</p><div className="account-address-actions"><button disabled={busy} onClick={()=>begin(address)}><Pencil size={13}/> Edit</button><button disabled={busy} aria-label={`Delete ${address.label||'delivery'} address`} onClick={()=>{setDeleting(address.id);setError('')}}><Trash2 size={13}/> Remove</button>{!address.isDefault&&<button disabled={busy} onClick={()=>void makeDefault(address)}>Set as default</button>}</div>{deleting===address.id&&<div className="account-confirmation" role="group" aria-label="Confirm address removal"><p>Remove this address from your account?</p><div><button className="account-danger-button" disabled={busy} onClick={()=>void remove(address)}>{busy?'Removing…':'Remove address'}</button><button disabled={busy} onClick={()=>setDeleting(null)}>Keep address</button></div></div>}</article>)}</div>:<div className="account-empty-state account-panel"><MapPin size={31} strokeWidth={1.2}/><h3>Where should your story arrive?</h3><p>Add a delivery address and make your next checkout feel effortless.</p><button className="account-secondary-button" onClick={()=>begin()}><Plus size={15}/> Add your first address</button></div>}
  </div>;
}
