import {randomUUID} from 'node:crypto';
import type {Poster,StoreProduct,StoreSettings} from '../commerce-types';
import {ApiError,emailValue,moneyValue,numberValue,phoneValue,requiredText,text,urlValue} from './security';
const slug=(value:string)=>value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64);
function stringList(value:unknown,max=20){const values=typeof value==='string'?value.split(/[,\n]/):Array.isArray(value)?value:[];return [...new Set(values.map(v=>text(v,100)).filter(Boolean))].slice(0,max)}
export function productValue(body:Record<string,unknown>,previous?:StoreProduct):StoreProduct{
 const now=new Date().toISOString(),name=requiredText(body.name,'a product name',100,2),id=previous?.id||slug(text(body.id,64)||name);if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id))throw new ApiError('Use a product ID with letters, numbers and hyphens.');
 const color=text(body.color||'#d7b48b',7);if(!/^#[0-9a-fA-F]{6}$/.test(color))throw new ApiError('Use a six-digit hex bottle colour.');
 const status=body.status||'draft';if(!['active','draft','archived'].includes(String(status)))throw new ApiError('Choose a valid product status.');
 const price=moneyValue(body.price,'50 ml price',1,1000000),price100=body.price100===undefined||body.price100===''?undefined:moneyValue(body.price100,'100 ml price',1,2000000);
 return{id,name,sku:requiredText(body.sku||`VEL-${id.toUpperCase()}`,'a SKU',80),family:requiredText(body.family,'a fragrance family',150),price,...(price100===undefined?{}:{price100}),color,notes:text(body.notes,400),rating:previous?.rating||0,reviews:previous?.reviews||'0',badge:text(body.badge,40),description:text(body.description,4000),image:urlValue(body.image,{empty:false}),stock:numberValue(body.stock??0,'stock quantity',0,1000000,true),status:status as StoreProduct['status'],featured:body.featured===true,topNotes:stringList(body.topNotes),heartNotes:stringList(body.heartNotes),baseNotes:stringList(body.baseNotes),createdAt:previous?.createdAt||now,updatedAt:now};
}
export function posterValue(body:Record<string,unknown>,previous?:Poster):Poster{
 const now=new Date().toISOString(),startsAt=text(body.startsAt,40),endsAt=text(body.endsAt,40);
 for(const date of [startsAt,endsAt])if(date&&!Number.isFinite(Date.parse(date)))throw new ApiError('Choose a valid campaign date.');
 if(startsAt&&endsAt&&Date.parse(startsAt)>=Date.parse(endsAt))throw new ApiError('Campaign end must be after its start.');
 return{id:previous?.id||slug(text(body.id,64)||text(body.name,100))||randomUUID(),name:requiredText(body.name,'a campaign name',100),eyebrow:text(body.eyebrow,120),title:requiredText(body.title,'a headline',180),description:text(body.description,500),image:urlValue(body.image,{empty:false}),mobileImage:urlValue(body.mobileImage||body.image,{empty:false}),buttonText:text(body.buttonText||'Explore Collection',60),buttonLink:urlValue(body.buttonLink||'/shop',{internal:true,empty:false}),productId:text(body.productId,100),active:body.active===true,position:numberValue(body.position??0,'display position',0,999,true),startsAt,endsAt,createdAt:previous?.createdAt||now,updatedAt:now};
}
export function settingsValue(body:Record<string,unknown>,previous:StoreSettings):StoreSettings{
 const result={...previous};
 for(const key of ['festivalOfferEnabled','festivalOfferFreeShipping'] as const)if(body[key]!==undefined){if(typeof body[key]!=='boolean')throw new ApiError('Choose a valid offer preference.');result[key]=body[key] as boolean}
 if(body.festivalOfferPercent!==undefined)result.festivalOfferPercent=numberValue(body.festivalOfferPercent,'offer discount',1,90,true);
 if(body.festivalOfferProductIds!==undefined){if(!Array.isArray(body.festivalOfferProductIds))throw new ApiError('Select eligible offer products.');result.festivalOfferProductIds=stringList(body.festivalOfferProductIds,100)}
 for(const key of ['festivalOfferStartsAt','festivalOfferEndsAt'] as const)if(body[key]!==undefined){const value=text(body[key],40);if(value&&!Number.isFinite(Date.parse(value)))throw new ApiError('Choose a valid offer date.');result[key]=value}
 if(result.festivalOfferEnabled!==false&&result.festivalOfferProductIds?.length===0)throw new ApiError('Select at least one eligible fragrance, or disable the offer.');
 if(result.festivalOfferStartsAt&&result.festivalOfferEndsAt&&Date.parse(result.festivalOfferStartsAt)>=Date.parse(result.festivalOfferEndsAt))throw new ApiError('The offer end must be after its start.');
 for(const key of ['storeName','description','announcement','address'] as const)if(body[key]!==undefined)result[key]=text(body[key],key==='address'?1000:500);
 if(!result.storeName)throw new ApiError('Enter a store name.');
 for(const key of ['storeEmail','supportEmail'] as const)if(body[key]!==undefined)result[key]=emailValue(body[key]);
 if(body.storePhone!==undefined)result.storePhone=body.storePhone?phoneValue(body.storePhone):'';
 if(body.instagram!==undefined)result.instagram=urlValue(body.instagram);
 for(const key of ['shippingFee','freeShippingThreshold'] as const)if(body[key]!==undefined)result[key]=moneyValue(body[key],key,0,1000000);
 if(body.taxRate!==undefined)result.taxRate=numberValue(body.taxRate,'tax rate',0,100);
 if(body.lowStockThreshold!==undefined)result.lowStockThreshold=numberValue(body.lowStockThreshold,'low stock threshold',0,1000000,true);
 if(body.orderPrefix!==undefined){const prefix=text(body.orderPrefix,10).toUpperCase();if(!/^[A-Z0-9]{2,10}$/.test(prefix))throw new ApiError('Use 2–10 letters or numbers for the order prefix.');result.orderPrefix=prefix}
 for(const key of ['codEnabled','maintenanceMode','allowCustomerSignup'] as const)if(typeof body[key]==='boolean')result[key]=body[key] as boolean;
 return result;
}
