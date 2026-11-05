export interface Product {offerEnabled?:boolean;offerPrice?:number;offerPrice100?:number;offer?:{percent:number;label:string;kind?:'product'|'festival';festivalPercent?:number};id:string;name:string;family:string;price:number;color:string;notes:string;rating:number;reviews:string;badge:string;image?:string;price100?:number;stock?:number;featured?:boolean;status?:'active'|'draft'|'archived';description?:string;topNotes?:string[];heartNotes?:string[];baseNotes?:string[]}
export const products:Product[] = [
 {id:'noir',name:'Noir Essence',family:'Woody · Bold · Mysterious',price:7299,color:'#17120d',notes:'Black pepper · Oud · Vetiver',rating:4.9,reviews:'1.8K',badge:'New'},
 {id:'flora',name:'Celeste',family:'Fresh · Clean · Invigorating',price:5499,color:'#a9b888',notes:'Neroli · Jasmine · White musk',rating:4.7,reviews:'1.3K',badge:''},
 {id:'ocean',name:'Aurora',family:'Citrus · Floral · Unisex',price:6999,color:'#e6b68c',notes:'Orange blossom · Lime · Soft woods',rating:4.8,reviews:'1.5K',badge:'Signature'},
 {id:'velvet',name:'Bloom',family:'Floral · Elegant · Long Lasting',price:6499,color:'#e6a49c',notes:'Rose · Peony · Vanilla',rating:4.8,reviews:'2.1K',badge:'Bestseller'},
 {id:'amber',name:'Oud Royale',family:'Oriental · Spicy · Luxurious',price:8999,color:'#a96025',notes:'Saffron · Oud · Amber',rating:4.9,reviews:'1.6K',badge:''},
];
export type BottleSize = 50 | 100;
export const money = (n:number) => `₹${n.toLocaleString('en-IN')}`;
export const baseProductPrice = (p:Product,size:BottleSize=50) => size===100?(p.price100??Math.round(p.price*1.6)):p.price;
export const productPrice = (p:Product,size:BottleSize=50) => {
 const base=baseProductPrice(p,size),sale=p.offerEnabled&&p.offerPrice&&p.offerPrice>0&&p.offerPrice<p.price?(size===100?(p.offerPrice100??Math.round(base*p.offerPrice/p.price*100)/100):p.offerPrice):base;
 const percent=p.offer?.festivalPercent??(p.offer?.kind==='product'?0:p.offer?.percent??0),festival=percent>0&&percent<100?Math.round(base*(100-percent))/100:base;
 return Math.min(base,sale>0&&sale<base?sale:base,festival);
};
export const productDiscount=(p:Product,size:BottleSize=50)=>Math.round((1-productPrice(p,size)/baseProductPrice(p,size))*100);
export const offerRibbon=(p:Product,size:BottleSize=50)=>`${p.offer?.label||'Special offer'}${productDiscount(p,size)>0?` · ${productDiscount(p,size)}% OFF`:''}`;
export function withProductOffer<T extends Product>(p:T,festival?:{percent:number;label:string}):T{
 const result:T={...p,offer:festival?{...festival,kind:'festival' as const,festivalPercent:festival.percent}:undefined};
 if(productPrice(result)<baseProductPrice(result)){
  const direct=productPrice({...p,offer:undefined}),festivalPrice=festival?productPrice({...p,offerEnabled:false,offer:festival}):Infinity;
  result.offer={percent:productDiscount(result),label:direct<festivalPrice?'Special offer':festival?.label||'Special offer',kind:direct<festivalPrice?'product':'festival',festivalPercent:festival?.percent||0};
 }
 return result;
}
export const cartKey = (id:string,size:BottleSize=50) => size===50?id:`${id}:100`;
export const cartQuantity=(cart:Record<string,number>,id:string)=>Object.entries(cart).reduce((sum,[key,quantity])=>sum+(key.split(':')[0]===id&&Number.isInteger(quantity)&&quantity>0?quantity:0),0);
export function cartItems(cart:Record<string,number>,catalog:Product[]=products){
 return Object.entries(cart).flatMap(([key,quantity])=>{
  const [id,variant]=key.split(':');
  const product=catalog.find(p=>p.id===id);
  if(!product||!Number.isInteger(quantity)||quantity<1||(variant&&variant!=='100'))return [];
  const size:BottleSize=variant==='100'?100:50;
  return [{...product,key,size,quantity,unitPrice:productPrice(product,size)}];
 });
}
