'use client';
import {useEffect,useState} from 'react';
export type ProductReview={id:string;name:string;title:string;body:string;rating:number;createdAt:number};
export function useProductReviews(productId:string){
 const [reviews,setReviews]=useState<ProductReview[]>([]);
 const [storageNotice,setStorageNotice]=useState('');
 const key=`aurealis-reviews:${productId}`;
 useEffect(()=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');setReviews(Array.isArray(value)?value.filter((r:ProductReview)=>r&&typeof r.id==='string'&&typeof r.name==='string'&&typeof r.title==='string'&&typeof r.body==='string'&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5&&Number.isFinite(r.createdAt)).slice(0,100):[])}catch{setReviews([])}},[key]);
 const commit=(next:ProductReview[])=>{setReviews(next);try{localStorage.setItem(key,JSON.stringify(next));setStorageNotice('')}catch{setStorageNotice('Browser storage is unavailable. Your review is visible for this session only.')}};
 const addReview=(data:Omit<ProductReview,'id'|'createdAt'>)=>commit([{...data,id:crypto.randomUUID(),createdAt:Date.now()},...reviews]);
 const removeReview=(id:string)=>commit(reviews.filter(r=>r.id!==id));
 return {reviews,addReview,removeReview,storageNotice};
}
