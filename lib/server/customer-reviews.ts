import {randomUUID} from 'node:crypto';
import type {Customer} from '../commerce-types';
import type {StoreState} from './store';
import {ApiError,numberValue,requiredText,text} from './security';

export function saveAccountReview(state:StoreState,user:Customer,method:string,body:Record<string,unknown>,id:string){
 const reviews=user.reviews||[],existing=reviews.find(review=>review.id===id);
 if(method!=='POST'&&!existing)throw new ApiError('Review not found.',404);
 if(method==='DELETE'){user.reviews=reviews.filter(review=>review.id!==id);user.updatedAt=new Date().toISOString();return}
 const productId=existing?.productId||text(body.productId,100);
 if(!state.orders.some(order=>order.customerId===user.id&&order.status==='delivered'&&order.items.some(item=>item.productId===productId)))throw new ApiError('You can review a fragrance after your order has been delivered.');
 if(method==='POST'&&reviews.some(review=>review.productId===productId))throw new ApiError('You already reviewed this fragrance. Edit your existing review.',409);
 if(method==='POST'&&reviews.length>=100)throw new ApiError('You can save up to 100 product reviews.');
 const now=new Date().toISOString(),review={id:existing?.id||randomUUID(),productId,rating:numberValue(body.rating,'rating',1,5,true),title:requiredText(body.title,'a review title',100,3),body:requiredText(body.body,'your review',2000,10),createdAt:existing?.createdAt||now,updatedAt:now};
 user.reviews=existing?reviews.map(item=>item.id===existing.id?review:item):[review,...reviews];user.updatedAt=now;
}
