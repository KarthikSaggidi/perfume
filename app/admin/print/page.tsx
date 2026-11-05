import {notFound,redirect} from 'next/navigation';
import type {AdminUser} from '@/lib/commerce-types';
import {transferResources} from '@/lib/admin-transfer';
import {type PrintResource,printDate} from '@/lib/admin-print';
import {currentIdentity} from '@/lib/server/security';
import {readStore} from '@/lib/server/store';
import {assertAdminResourceAccess} from '@/lib/server/admin-records';
import {defaultReportFilters,createReport} from '@/lib/admin-report';
import PrintControls from '@/components/admin/PrintControls';
import BrandLogo from '@/components/BrandLogo';
import PrintableReport,{PrintFilters,PrintableOrder} from '@/components/admin/PrintableReport';

export const dynamic='force-dynamic';
export default async function AdminPrintPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const admin=await currentIdentity('admin') as AdminUser|null;
 if(!admin)redirect('/admin/login');
 const raw=await searchParams,params=new URLSearchParams();for(const[key,value]of Object.entries(raw))if(typeof value==='string')params.set(key,value);
 const from=params.get('from'),to=params.get('to');if((from||to)&&(!Number.isFinite(Date.parse(from||''))||!Number.isFinite(Date.parse(to||''))||Date.parse(from!)>=Date.parse(to!)))notFound();
 const candidate=params.get('resource')||'overview';
 if(!['overview','reports'].includes(candidate)&&!Object.hasOwn(transferResources,candidate))notFound();
 const resource=candidate as PrintResource;
 if(resource!=='overview'&&resource!=='reports'){try{assertAdminResourceAccess(resource,admin.role)}catch{notFound()}}
 const state=await readStore(),order=resource==='orders'&&params.get('id')?state.orders.find(order=>order.id===params.get('id')):undefined;
 if(params.get('id')&&resource==='orders'&&!order)notFound();
 // A bookmarked dashboard print URL gets the same default reporting period.
 if((resource==='overview'||resource==='reports')&&!params.has('from')&&!params.has('to')){const report=createReport(state,defaultReportFilters);params.set('from',report.start.toISOString());params.set('to',new Date(report.end.getTime()+1).toISOString())}
 const title=order?`Order summary · ${order.number}`:resource==='overview'?'Dashboard':resource==='reports'?'Reports & analytics':transferResources[resource].label;
 return <main className="admin-print-page"><PrintControls autoPrint={params.get('autoprint')==='1'} title={`${state.settings.storeName} — ${title}`}/><article className={`admin-print-document ${order?'is-order':''}`}><div className="admin-print-brand"><div><BrandLogo/><span>{state.settings.storeName} · {order?'Order summary':'Store administration'}</span></div><p>Printed {printDate(new Date().toISOString(),true)} IST</p></div><div className="admin-print-title"><h1>{title}</h1>{order?<p>{[state.settings.storeEmail,state.settings.storePhone].filter(Boolean).join(' · ')}</p>:<PrintFilters params={params} state={state}/>}</div>{order?<PrintableOrder order={order}/>:<PrintableReport state={state} resource={resource} params={params}/>}<div className="admin-print-footer"><span>{state.settings.storeName}</span><span>Saved store records · {order?'Order summary':'Administrative report'}</span></div></article></main>;
}
