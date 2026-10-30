'use client';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight,Gift,Infinity as InfinityIcon,Leaf,Play,Truck,Watch} from 'lucide-react';
import ProductCommerce from './ProductCommerce';
import {products} from '@/lib/products';
import {fragranceFamilies} from '@/lib/fragrance-families';
import GlassProductCard from './GlassProductCard';
import AtelierImage from './AtelierImage';
import CampaignCarousel from './CampaignCarousel';
const benefits=[{Icon:Leaf,title:'Premium Ingredients',detail:'Sourced Globally'},{Icon:InfinityIcon,title:'Unisex Fragrances',detail:'For Every Mood'},{Icon:Watch,title:'Long Lasting',detail:'All Day Freshness'},{Icon:Gift,title:'Luxury Packaging',detail:'A Gift in Every Bottle'},{Icon:Truck,title:'Worldwide Shipping',detail:'Fragrance Anywhere'}];
export default function GlassHome(){return <ProductCommerce><main className="velora-home">
 <CampaignCarousel/>
 <section className="velora-benefits" aria-label="The Velora experience">{benefits.map(({Icon,title,detail})=><div key={title}><span><Icon size={25} strokeWidth={1.35}/></span><div><strong>{title}</strong><small>{detail}</small></div></div>)}</section>
 <div className="velora-home-content">
  <section className="velora-collections" aria-labelledby="collections-heading"><div className="velora-section-heading"><h2 id="collections-heading">Shop by Collection</h2><Link href="/collections">View All <ArrowRight size={15}/></Link></div><div className="velora-collection-grid">{fragranceFamilies.map(f=><Link href={f.href} className="velora-collection" key={f.name}><AtelierImage scene={f.scene} alt={`${f.name} fragrance collection`}/><div><h3>{f.name}</h3><p>{f.description}</p></div></Link>)}</div></section>
  <div className="velora-selection-layout"><section className="velora-bestsellers" aria-labelledby="bestsellers-heading"><div className="velora-section-heading"><h2 id="bestsellers-heading">Bestselling Fragrances</h2><Link href="/shop">View All <ArrowRight size={15}/></Link></div><div className="glass-products-grid velora-featured-products">{['velvet','noir','flora','amber'].map(id=><GlassProductCard key={id} product={products.find(p=>p.id===id)!}/>)}</div></section><aside className="velora-story-card"><Image src="/images/velora-story.webp" alt="Velora perfume in a sunlit garden, surrounded by blossoms and natural wood" fill sizes="(max-width:760px) 100vw, 30vw"/><div><h2>CRAFTED<br/>FOR EVERY<br/>JOURNEY</h2><p>From everyday moments<br/>to unforgettable memories.</p><Link href="/discover"><span><Play size={13} fill="currentColor"/></span>Watch Our Story</Link></div></aside></div>
  <Link className="velora-experience-strip" href="/discover"><Image src="/images/velora-hero.webp" alt="Velora Aurora" width={58} height={44}/><div><strong>Experience the 8D Fragrance Journey</strong><span>Feel every note come to life.</span></div><i><Play size={15} fill="currentColor"/></i></Link>
 </div>
 </main></ProductCommerce>}
