'use client';
import {useEffect,useRef} from 'react';
import {ArrowLeft,Printer} from 'lucide-react';
export default function PrintControls({autoPrint,title}:{autoPrint:boolean;title:string}){
 const printed=useRef(false);
 useEffect(()=>{
  document.title=title;
  if(!autoPrint)return;
  let cancelled=false;
  const ready=async()=>{
   await Promise.race([Promise.all([document.fonts.ready,...Array.from(document.images).map(image=>image.decode().catch(()=>{}))]),new Promise(resolve=>setTimeout(resolve,4000))]);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(!cancelled&&!printed.current){printed.current=true;window.print()}
  };
  void ready();return()=>{cancelled=true};
 },[autoPrint,title]);
 return <nav className="admin-print-controls" aria-label="Print controls"><a href="/admin"><ArrowLeft size={17}/>Back to admin</a><p>Use your browser’s print dialog to choose a printer or Save as PDF.</p><button type="button" onClick={()=>window.print()}><Printer size={18}/>Print / Save PDF</button></nav>;
}
