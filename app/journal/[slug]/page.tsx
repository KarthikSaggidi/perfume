import {notFound} from 'next/navigation';
import {articles} from '@/lib/editorial';
import {ArticlePage} from '@/components/EditorialPages';
export function generateStaticParams(){return articles.map(a=>({slug:a.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:`${articles.find(a=>a.slug===slug)?.title||'Journal'} — VELORA`}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!articles.some(a=>a.slug===slug))notFound();return <ArticlePage slug={slug}/>}
