import {notFound} from 'next/navigation';
import {collections} from '@/lib/editorial';
import {CollectionPage} from '@/components/EditorialPages';
export function generateStaticParams(){return collections.map(c=>({slug:c.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:`${collections.find(c=>c.slug===slug)?.name||'Collection'} — VELORA`}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!collections.some(c=>c.slug===slug))notFound();return <CollectionPage slug={slug}/>}
