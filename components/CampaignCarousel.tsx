'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {Swiper,SwiperSlide} from 'swiper/react';
import {A11y,Autoplay,EffectFade,Keyboard} from 'swiper/modules';
import type {Swiper as SwiperType} from 'swiper';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import 'swiper/css';
import 'swiper/css/effect-fade';
export const campaignBanners=[
 {id:'noir',src:'/images/banners/noir.png',title:'A Fragrance That Defines You',name:'Noir',description:'Auréalis Noir with golden wood and amber at a sunset marble terrace.',href:'/collections/signature',action:'Explore the signature collection'},
 {id:'ocean',src:'/images/banners/ocean.png',title:'Scents for a Brighter You',name:'Ocean Breeze',description:'Ocean Breeze beside citrus and white flowers at twilight.',href:'/collections/fresh',action:'Explore fresh fragrances'},
 {id:'vetiver',src:'/images/banners/vetiver.png',title:'More Than a Fragrance',name:'Vétiver Botanica',description:'Vétiver Botanica with woods and botanicals overlooking a golden coastal landscape.',href:'/collections/signature',action:'Discover the collection'},
 {id:'oud',src:'/images/banners/oud.png',title:'Elegance in Every Note',name:'Oud Elixir',description:'Oud Elixir, lavender, and warm amber in a sunlit architectural setting.',href:'/collections/spicy',action:'Explore woody and spicy fragrances'},
 {id:'citrus',src:'/images/banners/citrus.png',title:'Nature’s Finest in a Bottle',name:'Citrus Ambre',description:'Citrus Ambre with orange, white flowers, and glowing amber in warm morning light.',href:'/collections/citrus',action:'Explore the citrus collection'},
];
export default function CampaignCarousel(){const swiper=useRef<SwiperType|null>(null);const root=useRef<HTMLElement>(null);const [active,setActive]=useState(0);const preference=useReducedMotion();const [reduced,setReduced]=useState(false);
 useEffect(()=>setReduced(Boolean(preference)),[preference]);
 useEffect(()=>{if(!swiper.current)return;if(reduced)swiper.current.autoplay.stop();else swiper.current.autoplay.start()},[reduced]);
 useEffect(()=>{if(!root.current)return;const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)swiper.current?.autoplay.stop();else if(!reduced)swiper.current?.autoplay.start()},{threshold:.15});observer.observe(root.current);return()=>observer.disconnect()},[reduced]);
 return <section ref={root} className={`campaign-carousel ${reduced?'campaign-reduced':''}`} aria-label="Auréalis fragrance campaigns" aria-roledescription="carousel" onMouseEnter={()=>swiper.current?.autoplay.stop()} onMouseLeave={()=>{if(!reduced&&!root.current?.matches(':focus-within'))swiper.current?.autoplay.start()}} onFocusCapture={()=>swiper.current?.autoplay.stop()} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&!reduced&&!e.currentTarget.matches(':hover'))swiper.current?.autoplay.start()}}>
 <h1 className="visually-hidden">Auréalis — A fragrance that defines you</h1>
 <Swiper modules={[A11y,Autoplay,EffectFade,Keyboard]} effect="fade" fadeEffect={{crossFade:true}} speed={reduced?0:1000} loop keyboard={{enabled:true,onlyInViewport:true}} autoplay={{delay:7000,disableOnInteraction:false,pauseOnMouseEnter:true}} onSwiper={s=>{swiper.current=s;if(reduced)s.autoplay.stop()}} onSlideChange={s=>setActive(s.realIndex)} onAutoplayTimeLeft={(_,__,progress)=>root.current?.style.setProperty('--campaign-progress',`${(1-progress)*100}%`)}>{campaignBanners.map((b,i)=><SwiperSlide key={b.id} aria-label={`${i+1} of ${campaignBanners.length}: ${b.title}`}><Link className="campaign-artwork" href={b.href} aria-label={`${b.title}. ${b.action}`} tabIndex={active===i?0:-1}><Image src={b.src} alt={`${b.title} — ${b.description}`} width={1971} height={798} priority={i===0} sizes="(max-width:760px) 100vw, (max-width:1600px) 95vw, 1280px"/><span className="visually-hidden">{b.action}</span></Link></SwiperSlide>)}</Swiper>
 <div className="campaign-control-bar"><div className="campaign-arrows"><button aria-label="Previous banner" onClick={()=>swiper.current?.slidePrev()}><ArrowLeft size={16}/></button><button aria-label="Next banner" onClick={()=>swiper.current?.slideNext()}><ArrowRight size={16}/></button></div><div className="campaign-dots" aria-label="Choose a campaign">{campaignBanners.map((b,i)=><button key={b.id} aria-label={`Show ${b.name} banner`} aria-current={active===i} onClick={()=>swiper.current?.slideToLoop(i)}><span>{String(i+1).padStart(2,'0')}</span><i/></button>)}</div><p className="campaign-counter" aria-live="off">{String(active+1).padStart(2,'0')} <span>/ 05</span></p></div>
 </section>
}
