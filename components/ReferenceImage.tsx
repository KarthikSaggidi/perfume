import Image from 'next/image';
const regions:Record<string,[number,number,number,number]>={allcircle:[76,486,54,54],woodcircle:[250,487,53,53],freshcircle:[398,486,54,54],spicecircle:[531,486,54,54],citruscircle:[677,486,54,54],giftcircle:[812,486,54,54],hero:[422,113,411,335],noir:[86,639,201,173],ocean:[307,639,201,173],amber:[527,639,201,173],flora:[747,639,198,173],campaign:[59,977,506,255],signature:[76,1389,210,118],fresh:[300,1389,207,118],spicy:[523,1389,205,118],gifts:[746,1389,210,118]};
/** Display exact regions of the supplied reference without altering its pixels. */
export default function ReferenceImage({region,alt,className='',priority=false}:{region:string;alt:string;className?:string;priority?:boolean}){
 if(region==='velvet')return <div className={`reference-crop ${className}`}><Image src="/images/velvet-campaign.png" alt={alt} fill priority={priority} sizes="(max-width:760px) 50vw, 33vw" style={{objectFit:'cover'}}/></div>;
 const clean:Record<string,[number,number,number,number]>={signature:[0,0,768,512],fresh:[768,0,768,512],spicy:[0,512,768,512],gifts:[768,512,768,512]};
 const productRegions:Record<string,[number,number,number,number]>={noir:[0,0,627,627],ocean:[627,0,627,627],amber:[0,627,627,627],flora:[627,627,627,627]};
 const isProduct=Boolean(productRegions[region]);
 const isClean=Boolean(clean[region]);
 const [x,y,w,h]=productRegions[region]||clean[region]||regions[region]||regions.noir;
 const sourceWidth=isProduct?1254:isClean?1536:1024,sourceHeight=isProduct?1254:isClean?1024:1536;
 return <div className={`reference-crop ${className}`}><div className="reference-image-window" style={{width:`max(100cqw, ${h?100*w/h:100}cqh)`,aspectRatio:`${w}/${h}`}}><Image src={isProduct?'/images/product-campaigns.png':isClean?'/images/collection-art.png':'/images/reference-design.png'} alt={alt} width={sourceWidth} height={sourceHeight} priority={priority} sizes="(max-width:760px) 100vw, 50vw" style={{position:'absolute',width:`${sourceWidth/w*100}%`,height:`${sourceHeight/h*100}%`,maxWidth:'none',left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/></div></div>
}
