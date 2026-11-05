import {cookies} from 'next/headers';
import {randomBytes,randomUUID} from 'node:crypto';
import type {Customer,PublicFestivalOffer} from '../commerce-types';
import {customerFestivalOffer,festivalConfig,leadQualifies} from '../festival-offer';
import {appSurface} from '../app-surface';
import {audit,mutateStore,type StoreState} from './store';
import {ApiError,apiError,bodyJson,checkOrigin,checkSurface,currentIdentity,digest,emailValue,json,limit,phoneValue,requestIp,requiredText} from './security';
const claimCookie='velora_festival_claim',lifetime=30*86400;
export async function visitorFestivalOffer(state:StoreState):Promise<PublicFestivalOffer>{
 const config=festivalConfig(state.settings);
 config.active=config.active&&state.products.some(product=>product.status==='active'&&config.productIds.includes(product.id));
 if(!config.active||appSurface()==='admin')return{...config,unlocked:false};
 const identity=await currentIdentity('customer',state) as Customer|null;
 if(identity)return customerFestivalOffer(state.settings,state.leads,identity.phone);
 const token=(await cookies()).get(claimCookie)?.value;
 const claim=token&&state.offerClaims?.find(item=>item.hash===digest(token)&&Date.parse(item.expiresAt)>Date.now());
 return{...config,unlocked:Boolean(claim&&(claim.campaignId||'diwali')===config.campaignId&&state.leads?.some(lead=>lead.id===claim.leadId&&leadQualifies(lead,config.campaignId)))};
}
export async function handleFestivalClaim(request:Request){
 try{
  checkSurface(request);checkOrigin(request);
  if(request.method!=='POST')throw new ApiError('Method not allowed.',405);
  const body=await bodyJson(request);
  if(body.company)throw new ApiError('Your request could not be submitted.');
  const name=requiredText(body.name,'your full name',100,2),phone=phoneValue(body.phone),email=emailValue(body.email);
  if(!/^\+91[6-9]\d{9}$/.test(phone))throw new ApiError('Enter a valid ten-digit Indian mobile number.');
  if(body.marketingConsent!==undefined&&typeof body.marketingConsent!=='boolean')throw new ApiError('Choose a valid communication preference.');
  const identity=await currentIdentity('customer') as Customer|null;
  if(identity&&identity.phone!==phone)throw new ApiError('Use the mobile number for your signed-in account to claim this offer.');
  const previousToken=(await cookies()).get(claimCookie)?.value,token=randomBytes(32).toString('base64url');
  const offer=await mutateStore(state=>{
   limit(state,`offer-ip:${requestIp(request)}`,10,3600000);limit(state,`offer-phone:${digest(phone)}`,5,3600000);limit(state,'offer-global',1000,86400000);
   const config=festivalConfig(state.settings);
   if(body.campaignId!==undefined&&body.campaignId!==config.campaignId)throw new ApiError('This campaign has changed. Refresh the page to see the current offer.',409);
   if(!config.active||!state.products.some(product=>product.status==='active'&&config.productIds.includes(product.id)))throw new ApiError('This offer is no longer available.',409);
   state.leads??=[];state.offerClaims??=[];
   let lead=state.leads.find(lead=>lead.phone===phone);
   const previousClaim=previousToken&&state.offerClaims.find(claim=>claim.hash===digest(previousToken)&&Date.parse(claim.expiresAt)>Date.now());
   const own=identity?.phone===phone||previousClaim&&previousClaim.leadId===lead?.id,now=new Date().toISOString();
   if(lead?.status==='archived')throw new ApiError('This offer is unavailable for this mobile number. Contact the store for help.',409);
   if(!lead){lead={id:randomUUID(),name,phone,email,marketingConsent:body.marketingConsent===true,source:'festival-popup',campaignIds:[config.campaignId],status:'new',notes:'',createdAt:now,updatedAt:now};state.leads.push(lead);audit(state,'Storefront visitor','Claimed '+config.name+' offer','Offer lead')}
   else if(own){lead.name=name;lead.email=email;lead.marketingConsent=body.marketingConsent===true;lead.updatedAt=now}
   lead.campaignIds=[...new Set([...(lead.campaignIds||(lead.source==='diwali-popup'?['diwali']:[])),config.campaignId])];
   if(identity)lead.customerId=identity.id;
   if(previousClaim)state.offerClaims=state.offerClaims.filter(claim=>claim.id!==previousClaim.id);
   state.offerClaims.push({id:randomUUID(),leadId:lead.id,campaignId:config.campaignId,hash:digest(token),createdAt:now,expiresAt:new Date(Date.now()+lifetime*1000).toISOString()});
   return{...config,unlocked:true};
  });
  (await cookies()).set(claimCookie,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:lifetime});
  return json({offer});
 }catch(error){return apiError(error)}
}
