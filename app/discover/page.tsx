import type {Metadata} from 'next';
import FragranceJourney from '@/components/FragranceJourney';
import './discover.css';

export const metadata:Metadata={
  title:'The Sensory Experience — VELORA',
  description:'A closer encounter with Velora. Explore every bottle in 3D, discover the notes, and set the mood for your next signature fragrance.',
};

export default function DiscoverPage(){return <FragranceJourney/>}
