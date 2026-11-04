import type {StoreState} from './store';
import {ApiError,numberValue,text} from './security';

export function updateInventory(state:StoreState,value:unknown){
 if(!Array.isArray(value)||value.length<1||value.length>100)throw new ApiError('Select between one and 100 products.');
 const ids=new Set<string>();
 const updates=value.map(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item))throw new ApiError('Enter valid inventory updates.');
  const body=item as Record<string,unknown>,id=text(body.id,100),product=state.products.find(record=>record.id===id&&record.status!=='archived');
  if(!product)throw new ApiError('A selected product is unavailable. Refresh your inventory.',409);
  if(ids.has(id))throw new ApiError('A product can appear only once in an inventory update.');ids.add(id);
  const stock=numberValue(body.stock,'stock quantity',0,1000000,true),expected=numberValue(body.expectedStock,'previous stock quantity',0,1000000,true);
  if(product.stock!==expected)throw new ApiError(`${product.name} inventory changed while you were editing. Refresh before saving.`,409);
  return{product,stock};
 });
 const now=new Date().toISOString();
 for(const {product,stock} of updates)if(product.stock!==stock){product.stock=stock;product.updatedAt=now}
 return updates.map(({product})=>product);
}
