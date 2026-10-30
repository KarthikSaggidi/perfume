'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronDown,Flower2,Image as ImageIcon,Layers3,Leaf,Move3D,Moon,ShoppingBag,Sun,Volume2,VolumeX} from 'lucide-react';
import ProductCommerce,{useCommerce} from './ProductCommerce';
import ReferenceImage from './ReferenceImage';
import {money,products} from '@/lib/products';
import {productDetails} from '@/lib/product-details';

const HeroBottle=dynamic(()=>import('./HeroBottle'),{ssr:false,loading:()=> <div className="journey-model-loading"><Move3D size={30}/><span>Preparing your new perspective…</span></div>});
const layers=[
  {id:'top',number:'01',title:'Top notes',eyebrow:'THE FIRST IMPRESSION',heading:'A beautiful beginning.',description:'The opening encounter. Bright, expressive notes introduce the fragrance and invite you a little closer.',Icon:Sun},
  {id:'heart',number:'02',title:'Heart notes',eyebrow:'THE CHARACTER UNFOLDS',heading:'At the heart of it all.',description:'As the opening softens, a more personal story emerges. These notes give the composition its distinctive character.',Icon:Flower2},
  {id:'base',number:'03',title:'Base notes',eyebrow:'THE MEMORY THAT STAYS',heading:'A lasting impression.',description:'The final chapter. Warm, textured notes settle into a quieter presence, becoming part of your story.',Icon:Leaf},
] as const;

function Journey(){
  const [productId,setProductId]=useState('velvet');
  const [layer,setLayer]=useState<(typeof layers)[number]['id']>('top');
  const [view,setView]=useState<'photo'|'3d'>('photo');
  const [atmosphere,setAtmosphere]=useState<'dawn'|'dusk'>('dawn');
  const [sound,setSound]=useState(false),[soundNotice,setSoundNotice]=useState(''),[added,setAdded]=useState(false);
  const audio=useRef<AudioContext|null>(null);
  const {add}=useCommerce();
  const product=products.find(p=>p.id===productId)!;
  const details=productDetails[productId];
  const selectedLayer=layers.find(l=>l.id===layer)!;
  const LayerIcon=selectedLayer.Icon;

  useEffect(()=>()=>{void audio.current?.close();audio.current=null},[]);
  useEffect(()=>{if(!added)return;const timer=setTimeout(()=>setAdded(false),2000);return()=>clearTimeout(timer)},[added]);

  const toggleSound=async()=>{
    setSoundNotice('');
    if(audio.current){const current=audio.current;audio.current=null;await current.close();setSound(false);return}
    try{
      const context=new AudioContext();
      audio.current=context;
      const volume=context.createGain();
      volume.gain.setValueAtTime(0,context.currentTime);
      volume.gain.linearRampToValueAtTime(.025,context.currentTime+1.5);
      volume.connect(context.destination);
      [130.81,196,261.63].forEach((frequency,index)=>{
        const tone=context.createOscillator(),gain=context.createGain(),pan=context.createStereoPanner();
        tone.type='sine';tone.frequency.value=frequency;
        gain.gain.value=index===0?.5:.22;
        pan.pan.value=(index-1)*.6;
        tone.connect(gain);gain.connect(pan);pan.connect(volume);tone.start();
      });
      await context.resume();
      setSound(true);
    }catch{
      void audio.current?.close();audio.current=null;
      setSound(false);setSoundNotice('Ambient sound is unavailable in this browser. You can keep exploring the fragrance.');
    }
  };

  return <main className="fragrance-journey">
    <div className="journey-introduction"><Link className="journey-back" href="/"><ArrowLeft size={14}/> Back to our world</Link><div><p className="journey-eyebrow">THE SENSORY EXPERIENCE</p><h1>The invisible,<br/><em>made visible.</em></h1></div><p>A little light. A different perspective. <br/>Discover the beautiful details <br/>behind your next signature.</p></div>
    <section className={`journey-experience journey-atmosphere-${atmosphere}`} aria-label="Interactive fragrance discovery">
      <div className="journey-visual">
        <div className="journey-stage" aria-label={`${product.name} ${view==='3d'?'three-dimensional bottle':'campaign photograph'}`}>
          {view==='photo'?<div className="journey-photograph" key={product.id}><ReferenceImage region={product.id} alt={`${product.name} perfume bottle with its signature ingredients`} priority/></div>:<HeroBottle key={product.id} name={product.name} color={product.color} active/>}
          <div className="journey-stage-top"><span>VELORA <i/> {view==='3d'?'THE BOTTLE IN 3D':'A MOMENT IN SCENT'}</span><button className="journey-sound" onClick={()=>void toggleSound()} aria-pressed={sound} aria-label={sound?'Turn ambient sound off':'Turn ambient sound on'}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}<span>{sound?'Sound on':'Sound off'}</span></button></div>
          {view==='photo'&&<div className="journey-photo-caption"><span>{product.family}</span><strong>{product.name}</strong><p>{details.mood}</p></div>}
          <div className="journey-atmospheres" role="group" aria-label="Choose atmosphere"><button onClick={()=>setAtmosphere('dawn')} aria-pressed={atmosphere==='dawn'}><Sun size={14}/> Golden dawn</button><button onClick={()=>setAtmosphere('dusk')} aria-pressed={atmosphere==='dusk'}><Moon size={14}/> Evening glow</button></div>
        </div>
        <div className="journey-view-switch" role="group" aria-label="Choose fragrance view"><button onClick={()=>setView('photo')} aria-pressed={view==='photo'}><ImageIcon size={17}/><span>The campaign</span></button><button onClick={()=>setView('3d')} aria-pressed={view==='3d'}><Move3D size={18}/><span>Explore in 3D</span></button><span className="journey-view-hint">{view==='3d'?'A slow turn. Every beautiful detail.':'A feeling, captured in a moment.'}</span></div>
        {soundNotice&&<p className="journey-sound-notice" role="status">{soundNotice}</p>}
      </div>
      <div className="journey-composition">
        <p className="journey-eyebrow">BEYOND THE BOTTLE</p><h2>Feel every note<br/>come to life.</h2>
        <label className="journey-product-select" htmlFor="journey-fragrance"><span>Your fragrance</span><div><i style={{background:product.color}}/><select id="journey-fragrance" value={productId} onChange={e=>{setProductId(e.target.value);setAdded(false)}}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><ChevronDown size={16}/></div></label>
        <div className="journey-layer-tabs" role="group" aria-label="Choose a layer of the composition">{layers.map(l=><button key={l.id} aria-pressed={layer===l.id} onClick={()=>setLayer(l.id)}><span>{l.number}</span>{l.title}</button>)}</div>
        <div className="journey-note-story" aria-live="polite" aria-atomic="true" key={`${product.id}-${layer}`}><div className="journey-note-heading"><span><LayerIcon size={24} strokeWidth={1.2}/></span><p className="journey-eyebrow">{selectedLayer.eyebrow}</p></div><h3>{selectedLayer.heading}</h3><div className="journey-note-chips">{details[layer].map(note=><span key={note}>{note}</span>)}</div><p>{selectedLayer.description}</p></div>
        <p className="journey-product-description">{details.subtitle}</p>
        <div className="journey-purchase"><div><strong>{money(product.price)}</strong><span>50 ml · Eau de parfum</span></div><button onClick={()=>{add(product.id);setAdded(true)}}>{added?<Check size={17}/>:<ShoppingBag size={17}/>}<span>{added?'Added to your bag':'Add to bag'}</span></button></div><Link className="journey-product-link" href={`/products/${product.id}`}>Discover {product.name}<ArrowRight size={16}/></Link>
      </div>
    </section>
    <section className="journey-details" aria-label="Ways to explore your fragrance">
      <article><span>01</span><Move3D size={25} strokeWidth={1.15}/><h3>A different perspective.</h3><p>Switch to the 3D showcase to see the bottle slowly turn, from the textured cap to the light on the glass.</p></article>
      <article><span>02</span><Layers3 size={25} strokeWidth={1.15}/><h3>One note at a time.</h3><p>Explore the opening, the heart, and the final impression. Each layer tells another part of the fragrance story.</p></article>
      <article><span>03</span><Volume2 size={25} strokeWidth={1.15}/><h3>Make a little space.</h3><p>Choose your light and turn on a gentle ambient harmony. Take a quiet moment to find what feels like you.</p></article>
    </section>
    <div className="journey-closing"><p className="journey-eyebrow">YOUR STORY CONTINUES</p><h2>There’s a signature<br/><em>waiting for you.</em></h2><Link href="/shop">Explore all fragrances <ArrowRight size={17}/></Link></div>
  </main>;
}

export default function FragranceJourney(){return <ProductCommerce><Journey/></ProductCommerce>}
