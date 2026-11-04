import type {PublicFestivalOffer,StoreSettings,OfferLead} from './commerce-types';
export const festivalDefaults={festivalOfferEnabled:true,festivalOfferPercent:25,festivalOfferProductIds:['velvet','noir','flora','ocean','amber'],festivalOfferStartsAt:'',festivalOfferEndsAt:'',festivalOfferFreeShipping:true};
export function festivalConfig(settings:Partial<StoreSettings>,now=Date.now()){
 const config={...festivalDefaults,...Object.fromEntries(Object.entries(settings).filter(([,value])=>value!==undefined))};
 return {active:config.festivalOfferEnabled&&(!config.festivalOfferStartsAt||Date.parse(config.festivalOfferStartsAt)<=now)&&(!config.festivalOfferEndsAt||Date.parse(config.festivalOfferEndsAt)>now),percent:config.festivalOfferPercent,productIds:config.festivalOfferProductIds,freeShipping:config.festivalOfferFreeShipping,endsAt:config.festivalOfferEndsAt};
}
export const leadQualifies=(lead:OfferLead)=>lead.status!=='archived';
export function customerFestivalOffer(settings:StoreSettings,leads:OfferLead[]|undefined,phone:string):PublicFestivalOffer{
 const config=festivalConfig(settings);return{...config,unlocked:config.active&&Boolean(leads?.some(lead=>lead.phone===phone&&leadQualifies(lead)))};
}
