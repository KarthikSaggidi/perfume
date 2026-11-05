import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productPrice,withProductOffer,baseProductPrice} from '../lib/products';
import {productValue,settingsValue} from '../lib/server/admin-values';
import {initialState} from '../lib/server/store';
import {catalogView} from '../lib/server/catalog';
import {customerFestivalOffer,festivalConfig} from '../lib/festival-offer';
import {createOrder} from '../lib/server/orders';
import type {Customer,OfferLead} from '../lib/commerce-types';

test('variant product offers and festival discounts choose the lower price without stacking',()=>{
 const p={...initialState().products[0],price:1000,price100:1800,offerEnabled:true,offerPrice:600,offerPrice100:1500};
 assert.equal(productPrice(p),600);assert.equal(productPrice(p,100),1500);
 const combined=withProductOffer(p,{percent:25,label:'Christmas offer'});
 assert.equal(combined.offer?.kind,'product');assert.equal(productPrice(combined),600);assert.equal(productPrice(combined,100),1350);
 assert.equal(productPrice(withProductOffer({...p,offerEnabled:false},{percent:25,label:'Christmas offer'})),750);
 assert.equal(productPrice({...p,offerEnabled:false}),1000);
 assert.equal(productPrice({...p,offerPrice100:undefined},100),1080);
});
test('product offer validation rejects missing, nonnumeric and non-discounted enabled prices',()=>{
 const previous=initialState().products[0],body={...previous,price:1000,price100:1800,offerEnabled:true,offerPrice:800,offerPrice100:1400};
 assert.equal(productValue(body,previous).offerPrice100,1400);
 for(const patch of [{offerPrice:''},{offerPrice:1000},{offerPrice:-1},{offerPrice:'NaN'},{offerPrice100:1800},{offerEnabled:'true'}])assert.throws(()=>productValue({...body,...patch},previous));
 assert.equal(productValue({...body,offerEnabled:false},previous).offerEnabled,false);
});
test('catalog sale prices work before a festival claim and disappear when the product offer is disabled',()=>{
 const state=initialState(),p=state.products[0];Object.assign(p,{offerEnabled:true,offerPrice:5000});
 const publicProduct=catalogView(state).products.find(product=>product.id===p.id)!;
 assert.equal(productPrice(publicProduct),5000);assert.equal(publicProduct.offer?.label,'Special offer');
 p.offerEnabled=false;const regular=catalogView(state).products.find(product=>product.id===p.id)!;assert.equal(regular.offer,undefined);assert.equal(productPrice(regular),baseProductPrice(regular));
});
test('popup visibility and offer activation are independent, scheduled and validated',()=>{
 const settings=initialState().settings;
 assert.equal(festivalConfig({...settings,festivalPopupEnabled:false}).active,true);
 assert.equal(festivalConfig({...settings,festivalPopupEnabled:false}).popupEnabled,false);
 const announcement=festivalConfig({...settings,festivalOfferEnabled:false});assert.equal(announcement.active,false);assert.equal(announcement.popupEnabled,true);
 const scheduled=festivalConfig({...settings,festivalOfferStartsAt:'2099-01-01T00:00:00.000Z'});assert.equal(scheduled.active,false);assert.equal(scheduled.popupEnabled,false);
 assert.throws(()=>settingsValue({festivalPopupImage:'javascript:alert(1)'},settings));assert.throws(()=>settingsValue({festivalCampaignId:'invalid reference'},settings));assert.throws(()=>settingsValue({festivalPopupEnabled:'false'},settings));
});
test('claims are scoped to a campaign while legacy Diwali leads continue to qualify',()=>{
 const state=initialState(),now=new Date().toISOString(),lead:OfferLead={id:'lead',name:'Customer',phone:'+919000000071',email:'',marketingConsent:false,source:'diwali-popup',status:'new',notes:'',createdAt:now,updatedAt:now};
 assert.equal(customerFestivalOffer(state.settings,[lead],lead.phone).unlocked,true);
 const christmas={...state.settings,festivalCampaignId:'christmas-2026',festivalName:'Christmas'};
 assert.equal(customerFestivalOffer(christmas,[lead],lead.phone).unlocked,false);
 lead.campaignIds=['diwali','christmas-2026'];assert.equal(customerFestivalOffer(christmas,[lead],lead.phone).unlocked,true);
});
test('checkout enforces saved product offers and does not grant festival shipping for ineligible lines',()=>{
 const state=initialState(),now=new Date().toISOString();state.settings={...state.settings,codEnabled:true,shippingFee:90,taxRate:5,festivalOfferProductIds:['velvet']};
 const customer:Customer={id:'customer',phone:'+919000000072',name:'Customer',email:'',addresses:[],wishlist:[],tags:[],notes:'',marketingConsent:false,status:'active',createdAt:now,updatedAt:now,lastLoginAt:now};state.customers=[customer];
 const p=state.products.find(product=>product.id==='flora')!;Object.assign(p,{price:1000,price100:1800,offerEnabled:true,offerPrice:800,offerPrice100:1400,stock:5});
 state.leads=[{id:'lead',name:'Customer',phone:customer.phone,email:'',marketingConsent:false,source:'diwali-popup',status:'new',notes:'',createdAt:now,updatedAt:now}];
 const order=createOrder(state,customer,{idempotencyKey:'product-offer-checkout',items:[{productId:p.id,size:50,quantity:1,unitPrice:1},{productId:p.id,size:100,quantity:1,unitPrice:1}],address:{name:'Customer',phone:customer.phone,line1:'123 Test Street',city:'Hyderabad',state:'Telangana',postalCode:'500001',country:'India'},expectedTotal:2400});
 assert.deepEqual(order.items.map(line=>line.unitPrice),[800,1400]);assert.equal(order.shipping,90);assert.equal(order.total,2400);
});
