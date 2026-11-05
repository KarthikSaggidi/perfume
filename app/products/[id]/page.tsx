import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {publicCatalog} from '@/lib/server/catalog';
import {detailsForProduct} from '@/lib/product-details';
import ProductExperience from '@/components/ProductExperience';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params,product=(await publicCatalog()).products.find(p=>p.id===id);return product?{title:`${product.name} Eau de Parfum — ALORA`,description:detailsForProduct(product).description}:{title:'Fragrance unavailable — ALORA'}}
export default async function ProductPage({params}:{params:Promise<{id:string}>}){const {id}=await params,product=(await publicCatalog()).products.find(p=>p.id===id);if(!product)notFound();return <ProductExperience product={product}/>}
