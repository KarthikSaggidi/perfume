import {transferResources,type TransferResource} from '../admin-transfer';
import type {AdminUser} from '../commerce-types';
import type {StoreState} from './store';
import {ApiError,publicAdmin} from './security';

export function assertAdminResourceAccess(resource:string|undefined,role:AdminUser['role']):asserts resource is TransferResource {
 if(!resource||!Object.hasOwn(transferResources,resource))throw new ApiError('Choose an available data resource.',404);
 if(resource==='team'&&role!=='owner'||!['orders','customers','leads','activity'].includes(resource)&&role==='support')throw new ApiError('Your role cannot transfer this data.',403);
}
function records(state:StoreState,resource:TransferResource):Record<string,unknown>[] {
 if(resource==='settings')return Object.entries(state.settings).filter(([key])=>key!=='currency').map(([key,value])=>({key,value}));
 if(resource==='team')return state.admins.map(person=>({...publicAdmin(person)}));
 if(resource==='leads')return (state.leads||[]).map(lead=>({...lead}));
 if(resource==='activity')return state.activities.map(record=>({...record}));
 if(resource==='inventory')return state.products.filter(product=>product.status!=='archived').map(product=>({...product,expectedStock:product.stock}));
 return state[resource].map(record=>({...record}));
}
export function adminRecords(state:StoreState,resource:TransferResource,params:URLSearchParams){
 let data=records(state,resource);
 const schedule=params.get('schedule'),role=params.get('role'),actor=params.get('actor'),group=params.get('group');
 if(role&&role!=='all')data=data.filter(record=>record.role===role);
 if(actor&&actor!=='all')data=data.filter(record=>record.actor===actor);
 if(schedule&&schedule!=='all')data=data.filter(record=>{const status=!record.active?'inactive':record.startsAt&&Date.parse(String(record.startsAt))>Date.now()?'scheduled':record.endsAt&&Date.parse(String(record.endsAt))<Date.now()?'expired':'active';return status===schedule});
 if(resource==='settings'&&group&&group!=='all'){const groups:Record<string,string[]>={identity:['storeName','storeEmail','storePhone','description','address','instagram','announcement','supportEmail'],delivery:['shippingFee','freeShippingThreshold','taxRate','orderPrefix'],checkout:['codEnabled','maintenanceMode','allowCustomerSignup','lowStockThreshold'],connections:[],offers:['festivalOfferEnabled','festivalOfferPercent','festivalOfferProductIds','festivalOfferStartsAt','festivalOfferEndsAt','festivalOfferFreeShipping']};data=data.filter(record=>groups[group]?.includes(String(record.key)))}
 const query=(params.get('q')||'').trim().toLowerCase(),status=params.get('status'),category=params.get('category'),product=params.get('product'),region=params.get('region'),payment=params.get('payment'),from=params.get('from'),to=params.get('to');
 if(from||to){const start=Date.parse(from||''),end=Date.parse(to||'');if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end)throw new ApiError('Choose a valid report date range.');data=data.filter(record=>Date.parse(String(record.createdAt))>=start&&Date.parse(String(record.createdAt))<end)}
 if(query){
  const searchFields:Record<TransferResource,string[]>={products:['name','sku','family'],inventory:['name','sku','family'],orders:['number','customerName','phone','email'],customers:['name','phone','email','tags'],leads:['name','phone','email'],posters:['name','title'],team:['name','email'],activity:['actor','action','entity'],settings:['key','value']};
  data=data.filter(record=>searchFields[resource].map(key=>Array.isArray(record[key])?(record[key] as unknown[]).join(' '):String(record[key]??'')).join(' ').toLowerCase().includes(query));
 }
 if(status&&status!=='all')data=data.filter(record=>status==='low'?record.status==='active'&&Number(record.stock)<=state.settings.lowStockThreshold:status==='open'?['pending','confirmed','processing'].includes(String(record.status)):String(record.status??record.active)===status);
 if(payment&&payment!=='all')data=data.filter(record=>record.paymentStatus===payment);
 if(category&&category!=='all')data=data.filter(record=>resource==='orders'?(record.items as StoreState['orders'][number]['items']).some(item=>state.products.find(p=>p.id===item.productId)?.family.split('·')[0].trim()===category):String(record.family).split('·')[0].trim()===category);
 if(product&&product!=='all')data=data.filter(record=>resource==='orders'?(record.items as StoreState['orders'][number]['items']).some(item=>item.productId===product):record.id===product);
 if(region&&region!=='all')data=data.filter(record=>(record.address as {state?:string}|undefined)?.state===region);
 const id=params.get('id');if(id)data=data.filter(record=>record.id===id);
 return data;
}
