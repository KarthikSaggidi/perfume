'use client';

import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import {useRouter} from 'next/navigation';
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {Activity,ArrowUpRight,Bell,CalendarDays,ChartNoAxesCombined,Check,ChevronDown,Image as ImageIcon,KeyRound,LayoutDashboard,LifeBuoy,LoaderCircle,LogOut,Menu,Package,RefreshCw,Search,Settings2,ShieldCheck,ShoppingBag,Users,X} from 'lucide-react';
import type {AdminBootstrap} from '@/lib/commerce-types';
import Overview from './Overview';
import DataTools from './DataTools';
import RowMenu from './RowMenu';
import {ExportFiltersContext} from './ExportFilters';
import type {TransferResource} from '@/lib/admin-transfer';
import WorkspaceSearch from './WorkspaceSearch';
import ProductManager from './ProductManager';
import CampaignManager from './CampaignManager';
import OrdersManager from './OrdersManager';
import CustomersManager from './CustomersManager';
import OfferLeadsManager from './OfferLeadsManager';
import SettingsManager from './SettingsManager';
import {ActivityLog,TeamManager} from './TeamActivity';
import {Dialog,ErrorMessage,Field,human,initials,SaveButton,type Mutate,type Notice} from './AdminUi';

const sections=[
  {id:'overview',title:'Dashboard',Icon:LayoutDashboard,roles:['owner','manager','support']},
  {id:'products',title:'Products',Icon:Package,roles:['owner','manager']},
  {id:'inventory',title:'Inventory',Icon:Package,roles:['owner','manager']},
  {id:'reports',title:'Reports & analytics',Icon:ChartNoAxesCombined,roles:['owner','manager','support']},
  {id:'posters',title:'Campaigns & posters',Icon:ImageIcon,roles:['owner','manager']},
  {id:'orders',title:'Orders',Icon:ShoppingBag,roles:['owner','manager','support']},
  {id:'leads',title:'Offer leads',Icon:Users,roles:['owner','manager','support']},
  {id:'customers',title:'Customers',Icon:Users,roles:['owner','manager','support']},
  {id:'settings',title:'Store settings',Icon:Settings2,roles:['owner','manager']},
  {id:'team',title:'Team & access',Icon:ShieldCheck,roles:['owner']},
  {id:'activity',title:'Activity',Icon:Activity,roles:['owner','manager','support']},
];

type Toast={message:string;tone:'success'|'error'};
export default function AdminApp({storefrontUrl='/'}:{storefrontUrl?:string}){
  const router=useRouter();
  const [data,setData]=useState<AdminBootstrap|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[section,setSection]=useState('overview'),[mobile,setMobile]=useState(false),[busy,setBusy]=useState(false),[refreshing,setRefreshing]=useState(false),[toast,setToast]=useState<Toast|null>(null),[passwordOpen,setPasswordOpen]=useState(false);
  const menu=useRef<HTMLButtonElement>(null),navigationSequence=useRef(0);
  const [exportQuery,setExportQuery]=useState(''),[helpOpen,setHelpOpen]=useState(false),[clock,setClock]=useState(0);
  useEffect(()=>{setClock(Date.now());const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer)},[]);
  const [searchOpen,setSearchOpen]=useState(false),[target,setTarget]=useState<{id:string;sequence:number}|null>(null),[lastUpdated,setLastUpdated]=useState<number|null>(null);
  const sectionRef=useRef(section);sectionRef.current=section;
  const notify=useCallback<Notice>((message,tone='success')=>setToast({message,tone}),[]);
  const load=useCallback(async()=>{
    const response=await fetch('/api/admin/bootstrap',{cache:'no-store'});
    if(response.status===401){router.replace('/admin/login');return null}
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Your workspace could not be loaded.');
    setData(result as AdminBootstrap);setLastUpdated(Date.now());setError('');return result as AdminBootstrap;
  },[router]);
  useEffect(()=>{let active=true;void load().catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Your workspace could not be loaded.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[load]);
  const role=data?.admin.role;
  useEffect(()=>{if(!role)return;const [requested,id]=window.location.hash.slice(1).split('/');if(sections.some(s=>s.id===requested&&s.roles.includes(role))){setSection(requested);if(id&&/^[a-z0-9_-]{1,100}$/i.test(id))setTarget({id,sequence:++navigationSequence.current})}},[role]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),5000);return()=>clearTimeout(timer)},[toast]);
  useEffect(()=>{if(!mobile)return;const root=document.querySelector<HTMLElement>('.admin-sidebar');root?.querySelector<HTMLElement>('[aria-current=page]')?.focus({preventScroll:true});const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMobile(false);setTimeout(()=>menu.current?.focus(),0)}if(event.key==='Tab'){const items=[...root!.querySelectorAll<HTMLElement>('a,button:not(:disabled)')].filter(element=>element.getClientRects().length),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[mobile]);
  useEffect(()=>{const shortcut=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!searchOpen&&document.querySelector('[role="dialog"]'))return;setSearchOpen(value=>!value)}};document.addEventListener('keydown',shortcut);return()=>document.removeEventListener('keydown',shortcut)},[searchOpen]);
  useEffect(()=>{const update=()=>{if(document.hidden||sectionRef.current==='settings'||document.querySelector('[role="dialog"]'))return;void load().catch(()=>{})};window.addEventListener('focus',update);const timer=setInterval(update,60000);return()=>{window.removeEventListener('focus',update);clearInterval(timer)}},[load]);
  const navigate=(id:string,recordId?:string)=>{
    if(!data||!sections.some(item=>item.id===id&&item.roles.includes(data.admin.role)))return;
    if(document.querySelector('form[data-dirty="true"]')&&!window.confirm('Discard your unsaved settings changes?'))return;
    setSection(id);setTarget(recordId?{id:recordId,sequence:++navigationSequence.current}:null);setMobile(false);
    window.history.replaceState(null,'',`/admin#${id}${recordId?'/'+encodeURIComponent(recordId):''}`);
    document.querySelector<HTMLElement>('.admin-main')?.focus({preventScroll:true});document.querySelector('.admin-content')?.scrollTo({top:0,behavior:'instant'});
  };
  const mutate:Mutate=async(path,method,body)=>{
    if(busy)return false;setBusy(true);
    try{
      const response=await fetch(path,{method,headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
      if(response.status===401){router.replace('/admin/login');return false}
      if(!response.ok){let message='Your changes could not be saved.';try{message=(await response.json()).error||message}catch{}throw new Error(message)}
      await load();window.dispatchEvent(new Event('velora-catalog-change'));notify(method==='DELETE'?'Removed successfully.':'Your changes have been saved.');return true;
    }catch(reason){notify(reason instanceof Error?reason.message:'Your changes could not be saved.','error');return false}
    finally{setBusy(false)}
  };
  const refresh=async()=>{if(document.querySelector('form[data-dirty="true"]')&&!window.confirm('Discard your unsaved settings changes?'))return;setRefreshing(true);try{await load();notify('Workspace refreshed.')}catch(reason){notify(reason instanceof Error?reason.message:'Unable to refresh.','error')}finally{setRefreshing(false)}};
  const logout=async()=>{if(document.querySelector('form[data-dirty="true"]')&&!window.confirm('Discard your unsaved settings changes?'))return;setBusy(true);try{const response=await fetch('/api/auth/admin/logout',{method:'POST'});if(!response.ok)throw new Error('Unable to sign out. Please try again.');router.replace('/admin/login');router.refresh()}catch(reason){notify(reason instanceof Error?reason.message:'Unable to sign out.','error');setBusy(false)}};

  if(loading)return <div className="admin-loading"><span className="admin-loading-brand"><BrandLogo/></span><LoaderCircle size={26} className="admin-spin"/><p>Preparing your workspace…</p></div>;
  if(!data)return <div className="admin-loading"><span className="admin-loading-brand"><BrandLogo/></span>{error?<><ErrorMessage message={error}/><button className="admin-button admin-button-primary" onClick={()=>{setLoading(true);void load().catch(reason=>setError(reason.message)).finally(()=>setLoading(false))}}>Try again <RefreshCw size={15}/></button><Link href="/admin/login" className="admin-text-button">Return to sign-in</Link></>:<><LoaderCircle size={24} className="admin-spin"/><p>Taking you to secure sign-in…</p></>}</div>;
  const allowed=sections.filter(s=>s.roles.includes(data.admin.role));
  const current=allowed.find(s=>s.id===section)||allowed[0];
  const pendingOrders=data.orders.filter(o=>o.status==='pending').length;
  const lowStock=data.products.filter(p=>p.status==='active'&&p.stock<=data.settings.lowStockThreshold).length;
  const render=()=>{
    switch(current.id){
      case 'inventory':return <ProductManager key={target?.sequence||'inventory'} initialId={target?.id||'__inventory'} mode="inventory" products={data.products} threshold={data.settings.lowStockThreshold} mutate={mutate} notify={notify} busy={busy}/>;
      case 'products':return <ProductManager key={target?.sequence||'products'} initialId={target?.id} products={data.products} threshold={data.settings.lowStockThreshold} mutate={mutate} notify={notify} busy={busy}/>;
      case 'posters':return <CampaignManager key={target?.sequence||'posters'} initialId={target?.id} posters={data.posters} products={data.products} settings={data.settings} mutate={mutate} notify={notify} busy={busy}/>;
      case 'orders':return <OrdersManager key={target?.sequence||'orders'} initialId={target?.id} orders={data.orders} mutate={mutate} busy={busy}/>;
      case 'leads':return <OfferLeadsManager key={target?.sequence||'leads'} initialId={target?.id} leads={data.leads||[]} customers={data.customers} mutate={mutate} busy={busy}/>;
      case 'customers':return <CustomersManager key={target?.sequence||'customers'} initialId={target?.id} customers={data.customers} orders={data.orders} products={data.products} mutate={mutate} busy={busy}/>;
      case 'settings':return <SettingsManager products={data.products} settings={data.settings} integrations={data.integrations} mutate={mutate} busy={busy}/>;
      case 'team':return <TeamManager team={data.team} currentId={data.admin.id} mutate={mutate} busy={busy}/>;
      case 'activity':return <ActivityLog activities={data.activities}/>;
      default:return <Overview key={current.id} data={data} navigate={navigate}/>;
    }
  };
  const groups=[{title:'',ids:['overview']},{title:'STORE MANAGEMENT',ids:['products','inventory','orders','customers']},{title:'MARKETING',ids:['posters','leads']},{title:'ANALYTICS',ids:['reports','activity']},{title:'STORE CONFIGURATION',ids:['settings','team']}];
  const transferResource:TransferResource|'overview'=['overview','reports'].includes(current.id)?'overview':current.id as TransferResource;
  const beforeImport=()=>!document.querySelector('form[data-dirty="true"]')||window.confirm('Importing settings can replace your unsaved edits. Continue?');
  const clockDate=new Date(clock||Date.now()),calendar=clockDate.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}),clockTime=clockDate.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'});
  return <ExportFiltersContext.Provider value={setExportQuery}><div className="admin-shell"><a className="admin-skip" href="#admin-main">Skip to workspace content</a>{mobile&&<button className="admin-sidebar-backdrop" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}
   <aside className={`admin-sidebar ${mobile?'is-open':''}`} role={mobile?'dialog':undefined} aria-modal={mobile?true:undefined} aria-label="Administration sidebar"><button className="admin-sidebar-close" aria-label="Close sidebar" onClick={()=>setMobile(false)}><X size={21}/></button><Link href="/admin" className="admin-brand" aria-label="ALORA administration"><BrandLogo light/></Link><div className="admin-sidebar-scroll"><nav className="admin-nav" aria-label="Administration navigation">{groups.map(group=>{const links=allowed.filter(item=>group.ids.includes(item.id));return links.length?<div className="admin-nav-group" key={group.title}>{group.title&&<p className="admin-nav-label">{group.title}</p>}{links.map(({id,title,Icon})=><button key={id} aria-label={title} onClick={()=>navigate(id)} aria-current={current.id===id?'page':undefined}><Icon size={18}/><span>{title}</span>{id==='orders'&&pendingOrders>0&&<b aria-hidden="true">{pendingOrders}</b>}{id==='inventory'&&lowStock>0&&<b aria-hidden="true">{lowStock}</b>}</button>)}</div>:null})}</nav><div className="admin-sidebar-note"><ShieldCheck size={15}/><span>Signed in as {human(data.admin.role)}<small>{data.admin.email}</small></span></div></div><div className="admin-sidebar-bottom"><a href={storefrontUrl} target="_blank" rel="noopener noreferrer"><ShoppingBag size={18}/><span>View storefront</span><ArrowUpRight size={17}/></a><p className="admin-developer-credit">Designed and Developed by <a href="https://www.dropxcorp.in" target="_blank" rel="noopener noreferrer">DropXcorp Pvt Ltd</a></p></div></aside>
   <div className="admin-content" inert={mobile}><header className="admin-topbar"><div className="admin-topbar-context"><button ref={menu} className="admin-menu-toggle admin-icon-button" aria-label={mobile?'Close navigation':'Open navigation'} aria-expanded={mobile} onClick={()=>setMobile(value=>!value)}>{mobile?<X size={22}/>:<Menu size={22}/>}</button><div><strong>{current.title}</strong><p>Manage your ALORA store, products, orders, and customers.</p></div></div><div className="admin-topbar-actions"><time className="admin-calendar" dateTime={clockDate.toISOString()}><CalendarDays size={18}/><span>{calendar}</span><b>{clockTime}</b></time><button className="admin-workspace-search" onClick={()=>setSearchOpen(true)} aria-label="Search workspace"><Search size={17}/><span>Search products, orders, customers…</span></button><DataTools key={`data-tools-${current.id}`} resource={transferResource} printResource={current.id} role={data.admin.role} mutate={mutate} busy={busy} exportQuery={exportQuery} beforeOpen={beforeImport}/><button className="admin-icon-button admin-notifications" aria-label={`Orders awaiting confirmation: ${pendingOrders}`} onClick={()=>navigate('orders','__pending')}><Bell size={21}/>{pendingOrders>0&&<i/>}</button><button className="admin-icon-button" aria-label="Workspace help" onClick={()=>setHelpOpen(true)}><LifeBuoy size={21}/></button><RowMenu name="Workspace account" actions={[{label:'Refresh workspace',Icon:RefreshCw,onSelect:()=>void refresh(),disabled:refreshing||busy},{label:'Change your password',Icon:KeyRound,onSelect:()=>setPasswordOpen(true)},{label:'Sign out',Icon:LogOut,onSelect:()=>void logout(),disabled:busy,danger:true}]}><span className="admin-avatar admin-avatar-small">{initials(data.admin.name)}</span><ChevronDown size={16}/></RowMenu></div></header>
   <main className="admin-main" id="admin-main" tabIndex={-1}>{render()}<div className="admin-workspace-footer"><span>{data.settings.storeName} · Store workspace</span><span>All figures reflect actual store records.{lastUpdated&&` Updated ${new Date(lastUpdated).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'})}.`}</span></div></main></div>
   {toast&&<div className={`admin-toast admin-toast-${toast.tone}`} role={toast.tone==='error'?'alert':'status'}>{toast.tone==='success'?<Check size={18}/>:<X size={18}/>}<span>{toast.message}</span><button aria-label="Dismiss notification" onClick={()=>setToast(null)}><X size={15}/></button></div>}{searchOpen&&<WorkspaceSearch data={data} onOpen={navigate} onClose={()=>setSearchOpen(false)}/>}{passwordOpen&&<PasswordDialog mutate={mutate} busy={busy} close={()=>setPasswordOpen(false)}/>}{helpOpen&&<Dialog title="Your store workspace" description="Tools for managing the everyday details of your store." onClose={()=>setHelpOpen(false)}><div className="admin-dialog-body admin-form-stack"><p>Use Cmd/Ctrl K to find products, orders, customers and campaigns. Each record has an actions menu for editing and other available actions.</p><p>Filters apply to the current page. Export downloads the matching records. Import checks your CSV, previews every record, and checks again for changes before saving.</p><p>Order imports update existing orders. Inventory changes require the exported stock snapshot. Activity is recorded automatically and can be exported.</p><p>Customer SMS connection details are in Store settings. Payment statuses record cash collected by your team.</p></div></Dialog>}</div></ExportFiltersContext.Provider>;

}

function PasswordDialog({mutate,busy,close}:{mutate:Mutate;busy:boolean;close:()=>void}){
  const [currentPassword,setCurrentPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[error,setError]=useState('');
  const submit=async(e:FormEvent)=>{e.preventDefault();setError('');if(newPassword!==confirmation){setError('The new passwords do not match.');return}if(await mutate('/api/auth/admin/password','POST',{currentPassword,newPassword}))close()};
  return <Dialog title="Update your password" description="Keep your administrator access personal and secure." onClose={close} busy={busy}><form onSubmit={submit}><div className="admin-dialog-body admin-form-stack">{error&&<ErrorMessage message={error}/>}<Field label="Current password"><input type="password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} autoComplete="current-password" maxLength={128}/></Field><Field label="New password" hint="Use 12 to 128 characters."><input type="password" required minLength={12} maxLength={128} value={newPassword} onChange={e=>setNewPassword(e.target.value)} autoComplete="new-password"/></Field><Field label="Confirm new password"><input type="password" required minLength={12} maxLength={128} value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="new-password"/></Field></div><div className="admin-dialog-footer"><button type="button" className="admin-button admin-button-secondary" disabled={busy} onClick={close}>Cancel</button><SaveButton busy={busy}>Update password</SaveButton></div></form></Dialog>;
}
