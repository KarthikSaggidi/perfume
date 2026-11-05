'use client';
import Image from 'next/image';
import Link from 'next/link';
import {Fragment,useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import AtelierImage from './AtelierImage';
import {useStorefront} from './StoreDataProvider';
import {fragranceFamilies} from '@/lib/fragrance-families';
const seedCampaigns=[{id:'aurora',productId:'ocean',name:'Aurora',image:'/images/alora-hero.webp',mobileImage:'/images/alora-portrait.webp',eyebrow:'A FRAGRANCE\nFOR EVERY YOU',title:'SCENTS\nBEYOND\nBOUNDARIES',description:'Unisex fragrances crafted from the world’s rarest ingredients, designed to inspire every story.',buttonText:'Explore Collection',buttonLink:'/shop'}];
function Lines({text}:{text:string}){return <>{text.split('\n').map((line,index,array)=><Fragment key={index}>{line}{index<array.length-1&&<><br className="velora-desktop-break"/>{' '}</>}</Fragment>)}</>}
export default function CampaignCarousel(){
 const {posters,loaded}=useStorefront(),[active,setActive]=useState(0),campaigns=loaded?posters:seedCampaigns;
 useEffect(()=>setActive(0),[campaigns.length]);
 if(!campaigns.length)return null;
 const campaign=campaigns[Math.min(active,campaigns.length-1)];
 const change=(direction:number)=>setActive(value=>(value+direction+campaigns.length)%campaigns.length);
 return <section className={`velora-hero velora-campaign-${campaign.productId}`} aria-label="ALORA fragrance stories" aria-roledescription="carousel"><div className="velora-hero-art"><picture>{campaign.mobileImage&&<source media="(max-width:760px)" srcSet={campaign.mobileImage}/>}<Image key={campaign.id} src={campaign.image} alt={campaign.name} fill priority unoptimized sizes="(max-width:760px) 100vw, 1440px"/></picture></div><div className="velora-hero-shade"/><div className="velora-hero-copy" key={campaign.id}><p className="velora-overline"><Lines text={campaign.eyebrow}/></p><h1><Lines text={campaign.title}/></h1><p className="velora-hero-description">{campaign.description}</p><Link href={campaign.buttonLink} className="velora-pill-button">{campaign.buttonText}<ArrowRight size={17}/></Link><div className="velora-hero-stats"><div><strong>50+</strong><span>Signature Scents</span></div><div><strong>8D</strong><span>Sensory Experience</span></div><div><strong>100K+</strong><span>Happy Customers</span></div></div></div><aside className="velora-hero-families" aria-label="Explore fragrance families"><div className="velora-family-index" aria-hidden="true">{['01','02','03','04','05'].map(number=><span key={number}>{number}<i/></span>)}</div><div>{fragranceFamilies.slice(0,5).map(family=><Link href={family.href} key={family.name}><AtelierImage scene={family.scene} alt=""/><span><strong>{family.name}</strong><small>{family.description}</small></span></Link>)}</div></aside>{campaigns.length>1&&<><div className="velora-hero-pagination"><span aria-live="polite">{active+1}/{campaigns.length}</span>{campaigns.map((item,index)=><button key={item.id} onClick={()=>setActive(index)} aria-label={`Show ${item.name} story`} aria-current={active===index?'true':undefined}><i/></button>)}</div><div className="velora-hero-arrows"><button onClick={()=>change(-1)} aria-label="Previous fragrance story"><ArrowLeft size={19}/></button><button onClick={()=>change(1)} aria-label="Next fragrance story"><ArrowRight size={19}/></button></div></>}</section>;
}
