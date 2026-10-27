import type { Metadata } from 'next';
import './globals.css';
import './studio.css';
import './products.css';
import './glass-theme.css';
import './refinements.css';
import './atelier.css';
import './campaign-theme.css';
import './gloss.css';
import './responsive.css';
import './product-detail.css';
export const metadata: Metadata = {title:'AURÉALIS — Scents That Define Your Story',description:'Discover Noir Legacy, Titan, Ember, and Verde. Expressive fragrances, distinctive character, and a signature for every story.',openGraph:{title:'AURÉALIS — Scents That Define Your Story',description:'Scents that stay. Stories that live forever.',type:'website'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
