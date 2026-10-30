import Image from 'next/image';
type Asset = {src:string;width:number;height:number;crop:[number,number,number,number]};
const notes=(crop:Asset['crop']):Asset=>({src:'/images/notes-atlas.png',width:1024,height:1536,crop});
const editorial=(crop:Asset['crop']):Asset=>({src:'/images/editorial-atlas.png',width:1537,height:1023,crop});
const scenes:Record<string,Asset>={
 floral:{src:'/images/velora-bloom.webp',width:1254,height:1254,crop:[0,340,340,650]},
 fresh:{src:'/images/velora-celeste.webp',width:1254,height:1254,crop:[0,300,380,720]},
 gourmand:{src:'/images/velora-gourmand.webp',width:1536,height:1024,crop:[0,0,1536,1024]},
 wood:notes([0,0,512,512]),water:notes([512,0,512,512]),spice:notes([0,512,512,512]),citrus:notes([512,512,512,512]),bergamot:notes([0,1024,512,512]),sandalwood:notes([0,0,512,512]),amber:notes([512,1024,512,512]),
 gift:{src:'/images/collection-art.png',width:1536,height:1024,crop:[768,512,768,512]},
 signature:{src:'/images/velora-noir.webp',width:1254,height:1254,crop:[0,0,1254,1254]},occasion:editorial([0,0,768,510]),giftFeature:editorial([769,0,768,510]),newsletter:editorial([0,512,768,511]),footer:editorial([769,512,768,511]),
};
/** Display the selected campaign region at its original aspect ratio. */
export default function AtelierImage({scene,alt,className=''}:{scene:string;alt:string;className?:string}){const asset=scenes[scene]||scenes.wood;const [x,y,w,h]=asset.crop;return <div className={`atelier-image ${className}`}><div style={{width:`max(100cqw, ${100*w/h}cqh)`,aspectRatio:`${w}/${h}`}}><Image src={asset.src} width={asset.width} height={asset.height} alt={alt} sizes="(max-width:760px) 100vw, 50vw" style={{position:'absolute',width:`${asset.width/w*100}%`,height:`${asset.height/h*100}%`,maxWidth:'none',left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/></div></div>}
