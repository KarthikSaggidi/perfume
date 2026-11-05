import Image from 'next/image';

/** One transparent master keeps the supplied ALORA identity consistent. */
export default function BrandLogo({light=false,priority=false}:{light?:boolean;priority?:boolean}){
 return <span className={`brand-logo${light?' brand-logo--light':''}`}><Image src="/brand/alora-logo-transparent.webp" alt="ALORA — Your Scent. Your Signature." width={1920} height={833} sizes="(max-width:760px) 160px, 240px" priority={priority}/></span>;
}
