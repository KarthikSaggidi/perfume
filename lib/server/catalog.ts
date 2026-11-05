import type {PublicCatalog,PublicFestivalOffer} from '../commerce-types';
import {initialState,readStore} from './store';
import {withProductOffer} from '../products';
import {festivalConfig} from '../festival-offer';
import {visitorFestivalOffer} from './festival-offers';
export function catalogView(state:ReturnType<typeof initialState>,offer:PublicFestivalOffer={...festivalConfig(state.settings),unlocked:false}):PublicCatalog{
 const now=Date.now(),{storeName,description,shippingFee,freeShippingThreshold,taxRate,codEnabled,announcement,supportEmail,maintenanceMode}=state.settings;
 return{offer,products:state.products.filter(p=>p.status==='active').map(p=>withProductOffer(p,offer.active&&offer.unlocked&&offer.productIds.includes(p.id)?{percent:offer.percent,label:`${offer.name||'Diwali'} offer`}:undefined)),posters:state.posters.filter(p=>p.active&&(!p.startsAt||Date.parse(p.startsAt)<=now)&&(!p.endsAt||Date.parse(p.endsAt)>now)).sort((a,b)=>a.position-b.position),settings:{storeName,description,shippingFee,freeShippingThreshold,taxRate,codEnabled,announcement,supportEmail,maintenanceMode}};
}
export async function publicCatalog(){try{const state=await readStore();return catalogView(state,await visitorFestivalOffer(state))}catch(error){if(process.env.DATABASE_URL)throw error;return catalogView(initialState())}}
