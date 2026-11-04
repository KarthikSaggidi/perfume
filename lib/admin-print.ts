import type {TransferResource} from './admin-transfer';
export type PrintResource=TransferResource|'overview'|'reports';
export function adminPrintHref(resource:string,filters='',id?:string){
 const params=new URLSearchParams(filters.replace(/^&/,''));
 params.set('resource',resource);params.set('autoprint','1');
 if(id)params.set('id',id);
 return '/admin/print?'+params.toString();
}
export const printColumns:Record<TransferResource,readonly string[]>={
 products:['name','sku','family','price','price100','stock','status','featured'],
 inventory:['name','sku','stock','status','updatedAt'],
 orders:['number','customerName','phone','total','paymentStatus','status','createdAt'],
 customers:['name','phone','email','status','tags','marketingConsent','createdAt'],
 leads:['name','phone','email','status','marketingConsent','notes','createdAt'],
 posters:['name','title','active','position','productId','startsAt','endsAt'],
 settings:['key','value'],
 team:['name','email','role','active','createdAt'],
 activity:['actor','action','entity','createdAt'],
};
export const printLabels:Record<string,string>={name:'Name',sku:'SKU',family:'Fragrance family',price:'50 ml price',price100:'100 ml price',stock:'Available stock',status:'Status',featured:'Featured',updatedAt:'Last updated',number:'Order',customerName:'Customer',phone:'Mobile',total:'Total',paymentStatus:'Payment',createdAt:'Created',email:'Email',tags:'Tags',marketingConsent:'Marketing consent',notes:'Follow-up notes',title:'Headline',active:'Enabled',position:'Position',productId:'Product',startsAt:'Starts',endsAt:'Ends',key:'Setting',value:'Value',role:'Role',actor:'Team / customer',action:'Action',entity:'Record'};
export const printHuman=(value:string)=>value.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export const printMoney=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
export function printDate(value:string,withTime=false){if(!value||!Number.isFinite(Date.parse(value)))return '—';return new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',...(withTime?{dateStyle:'medium' as const,timeStyle:'short' as const}:{dateStyle:'medium' as const})})}
