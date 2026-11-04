import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import AtelierImage from './AtelierImage';

const reasons=[
 {title:'Distinctive notes',copy:'Discover layers of citrus, florals and warm woods.',scene:'citrus',alt:'Fresh citrus and green leaves',href:'/ingredients',link:'Explore the notes'},
 {title:'A scent for every mood',copy:'Everyday favourites. Fragrances for memorable moments.',scene:'signature',alt:'Velora Noir Essence perfume in warm golden light',href:'/shop',link:'Find your fragrance'},
 {title:'A little more personal',copy:'Keep your favourites close and your orders in one place.',scene:'floral',alt:'Delicate pink blossoms from the Bloom fragrance scene',href:'/account',link:'Your Velora account'},
];
export default function WhyChooseVelora(){
 return <section className="velora-why" aria-labelledby="why-velora-title"><div className="velora-why-heading"><p>CONSIDERED IN EVERY DETAIL</p><h2 id="why-velora-title">Why choose Velora</h2></div><div className="velora-why-reasons">{reasons.map(reason=><Link className="velora-why-reason" key={reason.title} href={reason.href}><div className="velora-why-photo"><AtelierImage scene={reason.scene} alt={reason.alt}/></div><div className="velora-why-copy"><h3>{reason.title}</h3><p>{reason.copy}</p><span>{reason.link}<ArrowUpRight size={13} aria-hidden="true"/></span></div></Link>)}</div></section>;
}
