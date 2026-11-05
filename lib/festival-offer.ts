import type {PublicFestivalOffer,StoreSettings,OfferLead} from './commerce-types';
export const festivalDefaults={festivalCampaignId:'diwali',festivalName:'Diwali',festivalPopupEnabled:true,festivalPopupTitle:'Diwali Special',festivalPopupSubtitle:'Exclusive Offer',festivalPopupDescription:'Celebrate the festival of lights with timeless fragrances from ALORA.',festivalPopupImage:'/images/alora-diwali-offer.webp',festivalPopupMobileImage:'',festivalPopupButtonText:'Claim my Diwali offer',festivalOfferEnabled:true,festivalOfferPercent:25,festivalOfferProductIds:['velvet','noir','flora','ocean','amber'],festivalOfferStartsAt:'',festivalOfferEndsAt:'',festivalOfferFreeShipping:true};
export function festivalConfig(settings:Partial<StoreSettings>,now=Date.now()){
 const config={...festivalDefaults,...Object.fromEntries(Object.entries(settings).filter(([,value])=>value!==undefined))};
 const scheduled=(!config.festivalOfferStartsAt||Date.parse(config.festivalOfferStartsAt)<=now)&&(!config.festivalOfferEndsAt||Date.parse(config.festivalOfferEndsAt)>now);
 return {campaignId:config.festivalCampaignId,name:config.festivalName,popupEnabled:config.festivalPopupEnabled&&scheduled,title:config.festivalPopupTitle,subtitle:config.festivalPopupSubtitle,description:config.festivalPopupDescription,image:config.festivalPopupImage,mobileImage:config.festivalPopupMobileImage,buttonText:config.festivalPopupButtonText,active:config.festivalOfferEnabled&&scheduled,percent:config.festivalOfferPercent,productIds:config.festivalOfferProductIds,freeShipping:config.festivalOfferFreeShipping,endsAt:config.festivalOfferEndsAt,label:`${config.festivalName} offer`};
}
export const leadQualifies=(lead:OfferLead,campaignId='diwali')=>lead.status!=='archived'&&(lead.campaignIds?lead.campaignIds.includes(campaignId):campaignId==='diwali');
export function customerFestivalOffer(settings:StoreSettings,leads:OfferLead[]|undefined,phone:string):PublicFestivalOffer{
 const config=festivalConfig(settings);return{...config,unlocked:config.active&&Boolean(leads?.some(lead=>lead.phone===phone&&leadQualifies(lead,config.campaignId)))};
}
