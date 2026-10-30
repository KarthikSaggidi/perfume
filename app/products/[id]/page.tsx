import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { products } from '@/lib/products';
import { productDetails } from '@/lib/product-details';
import ProductExperience from '@/components/ProductExperience';
export function generateStaticParams(){return products.map(p=>({id:p.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;const p=products.find(p=>p.id===id);return p?{title:`${p.name} Eau de Parfum — VELORA`,description:productDetails[id].description}:{};}
export default async function ProductPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const product=products.find(p=>p.id===id);if(!product)notFound();return <ProductExperience product={product}/>}
