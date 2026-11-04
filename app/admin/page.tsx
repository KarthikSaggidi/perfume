import {redirect} from 'next/navigation';
import AdminApp from '@/components/admin/AdminApp';
import {currentIdentity} from '@/lib/server/security';
import {appSurface,surfaceOrigin} from '@/lib/app-surface';
export const dynamic='force-dynamic';
export default async function AdminPage(){const admin=await currentIdentity('admin').catch(()=>null);if(!admin)redirect('/admin/login');return <AdminApp storefrontUrl={appSurface()==='combined'?'/':surfaceOrigin('storefront').origin}/>}
