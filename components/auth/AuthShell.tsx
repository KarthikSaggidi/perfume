import Link from 'next/link';
import type {ReactNode} from 'react';

export default function AuthShell({children,variant='customer',verify=false}:{children:ReactNode;variant?:'customer'|'admin';verify?:boolean}){
 return <main className={`velora-auth velora-auth--${variant}${verify?' velora-auth--verify':''}`}>
  <div className="velora-auth-backdrop" aria-hidden="true"/>
  <section className="velora-auth-card" aria-labelledby="signin-title">
   <Link href="/" className="velora-auth-brand" aria-label="Velora Fragrances home"><span>VELORA</span><small><i/>FRAGRANCES<i/></small></Link>
   {children}
   {variant==='customer'&&<svg className="velora-auth-waves" viewBox="0 0 656 136" fill="none" preserveAspectRatio="none" aria-hidden="true">{Array.from({length:9},(_,i)=><path key={i} d={`M-20 ${47+i*7} C125 ${32+i*6} 160 ${167-i*3} 302 ${116+i*3} S510 ${-24+i*15} 682 ${20+i*13}`} stroke="#dcb479" strokeWidth=".8" opacity={.85-i*.08}/>)}</svg>}
  </section>
 </main>;
}
