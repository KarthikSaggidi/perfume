'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import AtelierImage from './AtelierImage';
import {fragranceFamilies} from '@/lib/fragrance-families';
const campaigns=[
 {name:'Aurora',id:'ocean',image:'/images/velora-hero.webp',title:<>SCENTS<br className="velora-desktop-break"/> BEYOND<br className="velora-desktop-break"/> BOUNDARIES</>,description:'Unisex fragrances crafted from the world’s rarest ingredients, designed to inspire every story.'},
 {name:'Bloom',id:'velvet',image:'/images/velora-bloom.webp',title:<>A STORY<br className="velora-desktop-break"/> IN EVERY<br className="velora-desktop-break"/> BLOOM</>,description:'Romantic florals and luminous petals. A beautiful expression of everything that makes you, you.'},
 {name:'Noir Essence',id:'noir',image:'/images/velora-noir.webp',title:<>LEAVE<br className="velora-desktop-break"/> A LASTING<br className="velora-desktop-break"/> IMPRESSION</>,description:'Bold woods, golden warmth, and a little mystery. Discover a signature that stays with you.'},
];
export default function CampaignCarousel(){
 const [active,setActive]=useState(0),campaign=campaigns[active];
 const change=(direction:number)=>setActive(a=>(a+direction+campaigns.length)%campaigns.length);
 return <section className={`velora-hero velora-campaign-${campaign.id}`} aria-label="Velora fragrance stories" aria-roledescription="carousel">
  <div className="velora-hero-art"><picture>{campaign.id==='ocean'&&<source media="(max-width:760px)" srcSet="/images/velora-portrait.webp"/>}<Image key={campaign.id} src={campaign.image} alt={`${campaign.name} by Velora, surrounded by flowers, natural woods and golden light`} fill priority sizes="(max-width:760px) 100vw, 1440px" quality={90}/></picture></div><div className="velora-hero-shade"/>
  <div className="velora-hero-copy" key={campaign.id}><p className="velora-overline">A FRAGRANCE<br className="velora-desktop-break"/> FOR EVERY YOU</p><h1>{campaign.title}</h1><p className="velora-hero-description">{campaign.description}</p><Link href="/shop" className="velora-pill-button">Explore Collection <ArrowRight size={17}/></Link><div className="velora-hero-stats"><div><strong>50+</strong><span>Signature Scents</span></div><div><strong>8D</strong><span>Sensory Experience</span></div><div><strong>100K+</strong><span>Happy Customers</span></div></div></div>
  <aside className="velora-hero-families" aria-label="Explore fragrance families"><div className="velora-family-index" aria-hidden="true">{['01','02','03','04','05'].map(n=><span key={n}>{n}<i/></span>)}</div><div>{fragranceFamilies.slice(0,5).map(f=><Link href={f.href} key={f.name}><AtelierImage scene={f.scene} alt=""/><span><strong>{f.name}</strong><small>{f.description}</small></span></Link>)}</div></aside>
  <div className="velora-hero-pagination"><span aria-live="polite">{active+1}/3</span>{campaigns.map((c,i)=><button key={c.id} onClick={()=>setActive(i)} aria-label={`Show ${c.name} story`} aria-current={active===i?'true':undefined}><i/></button>)}</div><div className="velora-hero-arrows"><button onClick={()=>change(-1)} aria-label="Previous fragrance story"><ArrowLeft size={19}/></button><button onClick={()=>change(1)} aria-label="Next fragrance story"><ArrowRight size={19}/></button></div>
 </section>;
}
