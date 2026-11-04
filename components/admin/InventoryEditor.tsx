'use client';

import {useState,type FormEvent} from 'react';
import {Package} from 'lucide-react';
import type {StoreProduct} from '@/lib/commerce-types';
import {AdminProductImage,Dialog,SaveButton,type Mutate} from './AdminUi';

export default function InventoryEditor({products,mutate,busy,onClose,onSaved}:{products:StoreProduct[];mutate:Mutate;busy:boolean;onClose:()=>void;onSaved:()=>void}){
 const [items,setItems]=useState(()=>products.map(product=>({...product,expectedStock:product.stock})));
 const changed=items.filter(item=>item.stock!==item.expectedStock).length;
 const save=async(event:FormEvent)=>{event.preventDefault();if(!changed)return;if(await mutate('/api/admin/inventory','PATCH',{items:items.map(({id,stock,expectedStock})=>({id,stock,expectedStock}))}))onSaved()};
 return <Dialog title="Update inventory" description="Enter the number of bottles actually available. Both bottle sizes share this stock." onClose={onClose} busy={busy}>
  <form onSubmit={save}><div className="admin-dialog-body"><div className="admin-inventory-note"><Package size={18}/><p>Inventory is checked again when you save. A newer stock change will never be overwritten.</p></div><div className="admin-inventory-rows">{items.map(item=><label key={item.id}><span className="admin-table-image"><AdminProductImage productId={item.id} image={item.image}/></span><span><strong>{item.name}</strong><small>{item.sku} · Current: {item.expectedStock}</small></span><input aria-label={`${item.name} stock quantity`} required type="number" min="0" max="1000000" step="1" value={item.stock} onChange={event=>setItems(current=>current.map(product=>product.id===item.id?{...product,stock:event.target.value===''?0:Number(event.target.value)}:product))}/></label>)}</div></div><div className="admin-dialog-footer"><p>{changed} {changed===1?'product':'products'} changed</p><button type="button" className="admin-button admin-button-secondary" disabled={busy} onClick={onClose}>Cancel</button><SaveButton busy={busy} disabled={!changed}>Save inventory</SaveButton></div></form>
 </Dialog>;
}
