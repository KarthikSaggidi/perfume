'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {motion,useInView,useReducedMotion,useScroll,useSpring,useTransform} from 'motion/react';
import {ArrowRight,BadgeCheck,Flower2,Gem,Gift,Headphones,Heart,Leaf,Truck} from 'lucide-react';

const MotionLink=motion.create(Link);
const reasons=[
 {title:'Distinctive by nature',copy:'Bright citrus. Soft florals. Deep woods. Find the notes that feel like you.',href:'/ingredients',Icon:Leaf},
 {title:'Made for your many moods',copy:'From everyday rituals to memorable evenings. A signature for every version of you.',href:'/shop',Icon:Gem},
 {title:'A little more personal',copy:'Your favourites, your discoveries, your collection. Keep your fragrance story close.',href:'/account',Icon:Heart},
];
const services=[
 {title:'Delivery & care',href:'/help',Icon:Truck},
 {title:'Signature compositions',href:'/collections/signature',Icon:BadgeCheck},
 {title:'Thoughtful gifting',href:'/collections/gifts',Icon:Gift},
 {title:'Fragrance guidance',href:'/help',Icon:Headphones},
];

export default function WhyChooseVelora(){
 const section=useRef<HTMLElement>(null),inView=useInView(section,{amount:.08});
 const motionPreference=useReducedMotion(),[reducedMotion,setReducedMotion]=useState<boolean|null>(null);
 // Match the server render before applying the browser's motion preference.
 useEffect(()=>setReducedMotion(motionPreference),[motionPreference]);
 const animated=!reducedMotion;
 const {scrollYProgress}=useScroll({target:section,offset:['start end','end start']});
 const photoY=useSpring(useTransform(scrollYProgress,[0,1],[-8,8]),{stiffness:70,damping:25});
 const reveal=(delay=0)=>({initial:animated?{opacity:0,y:18}:false as const,whileInView:{opacity:1,y:0},viewport:{once:true,amount:.16},transition:{duration:animated?.7:0,delay:animated?delay:0,ease:[.22,1,.36,1] as [number,number,number,number]}});
 return <section ref={section} className={`velora-why${inView?' is-in-view':''}`} data-motion={animated?'on':'off'} aria-labelledby="why-velora-title">
  <div className="velora-why-hero">
   <motion.div className="velora-why-art" style={animated?{y:photoY}:undefined}><Image src="/images/alora-why-signature.webp" alt="ALORA Noir Essence with jasmine, orange and sculptural woods in warm sunlight" fill sizes="100vw" quality={90}/></motion.div>
   <div className="velora-why-heading"><motion.p {...reveal()}>THE ALORA DIFFERENCE<span/></motion.p><motion.h2 id="why-velora-title" {...reveal(.08)}>Why choose <em>ALORA</em></motion.h2><motion.p className="velora-why-description" {...reveal(.16)}>A fragrance experience that goes beyond scent — crafted with care, authenticity, and a touch of your story.</motion.p><motion.div className="velora-why-actions" {...reveal(.24)}><Link className="velora-why-discover" href="/shop">Discover Our Fragrances<ArrowRight size={18} aria-hidden="true"/></Link></motion.div></div>

  </div>
  <div className="velora-why-details"><div className="velora-why-divider" aria-hidden="true"><span/><Flower2 size={25} strokeWidth={1.3}/><span/></div><div className="velora-why-reasons">{reasons.map((reason,index)=><MotionLink key={reason.href} className="velora-why-reason" href={reason.href} {...reveal(index*.12)} whileHover={animated?{y:-4,transition:{duration:.25,delay:0}}:undefined}><reason.Icon className="velora-why-feature-icon" size={39} strokeWidth={1.15} aria-hidden="true"/><div className="velora-why-copy"><h3>{reason.title}</h3><p>{reason.copy}</p></div></MotionLink>)}</div></div>
  <div className="velora-why-services" aria-label="Explore ALORA services"><svg className="velora-why-waves" viewBox="0 0 1600 120" fill="none" preserveAspectRatio="none" aria-hidden="true">{Array.from({length:7},(_,i)=><path key={i} d={`M-100 ${15+i*8}C110 ${110+i*3} 180 ${150+i*6} 430 ${120+i*9}S1300 ${100+i*3} 1700 ${12+i*9}`} stroke="currentColor" strokeWidth=".65"/>)}</svg>{services.map(({title,href,Icon},index)=><MotionLink href={href} key={title} {...reveal(.08*index)}><Icon size={31} strokeWidth={1.2} aria-hidden="true"/><span>{title}</span><ArrowRight className="velora-why-service-arrow" size={14} aria-hidden="true"/></MotionLink>)}</div>
 </section>;
}
