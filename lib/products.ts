export const products = [
 {id:'noir',name:'Noir Legacy',family:'Woody · Spicy',price:2799,color:'#072537',notes:'Black pepper · Oud · Vetiver'},
 {id:'flora',name:'Verde Essence',family:'Fresh · Aromatic',price:2299,color:'#65724a',notes:'Neroli · Jasmine · White musk'},
 {id:'ocean',name:'Titan',family:'Fresh · Citrus',price:2499,color:'#d8c6a1',notes:'Sea salt · Bergamot · Cedar'},
 {id:'velvet',name:'Velvet Bloom',family:'Floral · Oriental',price:2299,color:'#d5998e',notes:'Bulgarian rose · Peony · Sandalwood'},
 {id:'amber',name:'Amber Command',family:'Amber · Woody',price:2599,color:'#814018',notes:'Saffron · Amber · Vanilla'},
];
export type Product = typeof products[number];
export const money = (n:number) => `₹${n.toLocaleString('en-IN')}`;
