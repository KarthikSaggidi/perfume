import {mkdir,readFile,writeFile,rename,open,unlink,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';
import {festivalDefaults} from '../festival-offer';
import {products} from '../products';
import {productDetails} from '../product-details';
import {currentBrandImage,currentStoreName} from '../brand';
import type {Activity,AdminUser,Customer,Order,Poster,StoreProduct,StoreSettings,OfferLead,OfferClaim} from '../commerce-types';
export interface SessionRecord {id:string;hash:string;subjectId:string;kind:'admin'|'customer';expiresAt:string;createdAt:string}
export interface Challenge {id:string;phone:string;provider:'twilio'|'development';hash:string;status:'pending'|'active'|'used'|'expired';attempts:number;createdAt:string;expiresAt:string}
export interface StoreState {leads?:OfferLead[];offerClaims?:OfferClaim[];version:1;products:StoreProduct[];posters:Poster[];orders:Order[];customers:Customer[];admins:AdminUser[];sessions:SessionRecord[];challenges:Challenge[];limits:Record<string,{count:number;resetAt:number}>;settings:StoreSettings;activities:Activity[];orderSequence:number}
export const localStorageAllowed=()=>!process.env.VERCEL&&(process.env.NODE_ENV!=='production'||process.env.VELORA_LOCAL_STORAGE==='true');
export const dataDirectory=()=>path.resolve(process.env.VELORA_DATA_DIR||path.join(process.cwd(),'.velora'));
export const defaultSettings:StoreSettings={...festivalDefaults,storeName:'ALORA',storeEmail:'',storePhone:'',currency:'INR',description:'Scents beyond boundaries.',shippingFee:0,freeShippingThreshold:0,taxRate:0,codEnabled:false,lowStockThreshold:5,orderPrefix:'VEL',announcement:'',supportEmail:'',instagram:'',address:'',maintenanceMode:false,allowCustomerSignup:true};
export function initialState():StoreState{
 const now=new Date().toISOString(),images:Record<string,string>={noir:'noir',flora:'celeste',ocean:'portrait',velvet:'bloom',amber:'oud'};
 return {version:1,products:products.map(p=>({...p,sku:`VEL-${p.id.toUpperCase()}`,description:productDetails[p.id].description,image:`/images/alora-${images[p.id]}.webp`,stock:0,status:'active',featured:p.id!=='ocean',topNotes:productDetails[p.id].top,heartNotes:productDetails[p.id].heart,baseNotes:productDetails[p.id].base,createdAt:now,updatedAt:now})),posters:[{id:'aurora',name:'Aurora signature campaign',eyebrow:'A FRAGRANCE\nFOR EVERY YOU',title:'SCENTS\nBEYOND\nBOUNDARIES',description:'Unisex fragrances crafted from the world’s rarest ingredients, designed to inspire every story.',image:'/images/alora-hero.webp',mobileImage:'/images/alora-portrait.webp',buttonText:'Explore Collection',buttonLink:'/shop',productId:'ocean',active:true,position:0,startsAt:'',endsAt:'',createdAt:now,updatedAt:now},{id:'bloom',name:'Bloom floral campaign',eyebrow:'A FRAGRANCE\nFOR EVERY YOU',title:'A STORY\nIN EVERY\nBLOOM',description:'Romantic florals and luminous petals. A beautiful expression of everything that makes you, you.',image:'/images/alora-bloom.webp',mobileImage:'/images/alora-bloom.webp',buttonText:'Discover Bloom',buttonLink:'/products/velvet',productId:'velvet',active:true,position:1,startsAt:'',endsAt:'',createdAt:now,updatedAt:now},{id:'noir',name:'Noir Essence campaign',eyebrow:'A FRAGRANCE\nFOR EVERY YOU',title:'LEAVE\nA LASTING\nIMPRESSION',description:'Bold woods, golden warmth, and a little mystery. Discover a signature that stays with you.',image:'/images/alora-noir.webp',mobileImage:'/images/alora-noir.webp',buttonText:'Discover Noir Essence',buttonLink:'/products/noir',productId:'noir',active:true,position:2,startsAt:'',endsAt:'',createdAt:now,updatedAt:now}],orders:[],customers:[],admins:[],sessions:[],challenges:[],limits:{},settings:{...defaultSettings},activities:[],orderSequence:0};
}
let sqlClient:ReturnType<typeof postgres>|undefined;
let initialization:Promise<void>|undefined;
export function database(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required for persistent production storage.');
 if(!sqlClient)sqlClient=postgres(process.env.DATABASE_URL,{max:3,idle_timeout:20,connect_timeout:10,prepare:false,ssl:process.env.DATABASE_SSL==='disable'?false:process.env.DATABASE_SSL==='require'?'require':undefined});
 return sqlClient;
}
async function initializeDatabase(){
 if(!initialization)initialization=(async()=>{const sql=database();await sql`CREATE TABLE IF NOT EXISTS velora_store (id TEXT PRIMARY KEY, state JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;await sql`CREATE TABLE IF NOT EXISTS velora_media (id TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;await sql`INSERT INTO velora_store (id,state) VALUES ('main',${sql.json(initialState() as unknown as postgres.JSONValue)}) ON CONFLICT (id) DO NOTHING`})().catch(e=>{initialization=undefined;throw e});
 await initialization;
}
function currentBrand(state:StoreState){
 state.settings={...festivalDefaults,...state.settings,festivalPopupEnabled:state.settings.festivalPopupEnabled??state.settings.festivalOfferEnabled??true};
 state.settings.storeName=currentStoreName(state.settings.storeName);
 for(const product of state.products)product.image=currentBrandImage(product.image);
 for(const poster of state.posters){poster.image=currentBrandImage(poster.image);poster.mobileImage=currentBrandImage(poster.mobileImage);}
 for(const order of state.orders)for(const item of order.items)item.image=currentBrandImage(item.image);
 return state;
}
async function loadLocal():Promise<StoreState>{try{return currentBrand(JSON.parse(await readFile(path.join(dataDirectory(),'store.json'),'utf8')) as StoreState)}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return initialState();throw e}}
export async function readStore():Promise<StoreState>{
 if(process.env.DATABASE_URL){await initializeDatabase();const rows=await database()`SELECT state FROM velora_store WHERE id='main'`;return currentBrand(structuredClone(rows[0].state as StoreState))}
 if(!localStorageAllowed())throw new Error('Persistent storage is not configured. Set DATABASE_URL before using accounts or administration.');
 return loadLocal();
}
export async function mutateStore<T>(update:(state:StoreState)=>T|Promise<T>):Promise<T>{
 if(process.env.DATABASE_URL){await initializeDatabase();const sql=database();return sql.begin(async transaction=>{const rows=await transaction`SELECT state FROM velora_store WHERE id='main' FOR UPDATE`;const state=currentBrand(rows[0].state as StoreState);const result=await update(state);prune(state);await transaction`UPDATE velora_store SET state=${transaction.json(state as unknown as postgres.JSONValue)},updated_at=NOW() WHERE id='main'`;return result}) as Promise<T>}
 if(!localStorageAllowed())throw new Error('Persistent storage is not configured. Set DATABASE_URL before using accounts or administration.');
 const directory=dataDirectory();await mkdir(directory,{recursive:true,mode:0o700});const lock=path.join(directory,'store.lock');const deadline=Date.now()+12000;let handle;
 while(!handle){try{handle=await open(lock,'wx',0o600)}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;try{if(Date.now()-(await stat(lock)).mtimeMs>60000)await unlink(lock)}catch{}if(Date.now()>deadline)throw new Error('The store is busy. Please retry.');await new Promise(resolve=>setTimeout(resolve,40))}}
 try{const state=await loadLocal(),result=await update(state);prune(state);const temporary=path.join(directory,`store-${randomUUID()}.tmp`);await writeFile(temporary,JSON.stringify(state),{mode:0o600});await rename(temporary,path.join(directory,'store.json'));return result}finally{await handle.close();await unlink(lock).catch(()=>{})}
}
function prune(state:StoreState){const now=Date.now();if(state.offerClaims)state.offerClaims=state.offerClaims.filter(claim=>Date.parse(claim.expiresAt)>now);state.sessions=state.sessions.filter(s=>Date.parse(s.expiresAt)>now);state.challenges=state.challenges.filter(c=>Date.parse(c.expiresAt)>now-86400000).slice(-1000);for(const [key,value] of Object.entries(state.limits))if(value.resetAt<now)delete state.limits[key];state.activities=state.activities.slice(-1000)}
export function audit(state:StoreState,actor:string,action:string,entity:string){state.activities.push({id:randomUUID(),actor,action,entity,createdAt:new Date().toISOString()})}
export async function saveMedia(id:string,mime:string,bytes:Buffer){if(process.env.DATABASE_URL){await initializeDatabase();await database()`INSERT INTO velora_media (id,mime,bytes) VALUES (${id},${mime},${bytes})`;return}if(!localStorageAllowed())throw new Error('Storage is not configured.');const dir=path.join(dataDirectory(),'media');await mkdir(dir,{recursive:true,mode:0o700});await writeFile(path.join(dir,id),bytes,{mode:0o600});await writeFile(path.join(dir,`${id}.json`),JSON.stringify({mime}),{mode:0o600})}
export async function loadMedia(id:string){if(!/^[a-f0-9-]{36}$/.test(id))return null;if(process.env.DATABASE_URL){await initializeDatabase();const rows=await database()`SELECT mime,bytes FROM velora_media WHERE id=${id}`;return rows[0]?{mime:String(rows[0].mime),bytes:Buffer.from(rows[0].bytes)}:null}if(!localStorageAllowed())return null;try{const [bytes,meta]=await Promise.all([readFile(path.join(dataDirectory(),'media',id)),readFile(path.join(dataDirectory(),'media',`${id}.json`),'utf8')]);return{bytes,mime:JSON.parse(meta).mime as string}}catch{return null}}
