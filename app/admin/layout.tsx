import type {Metadata} from 'next';
import './admin.css';
import './workspace.css';
import './dashboard.css';
import './print.css';

export const metadata:Metadata={title:'Store administration — ALORA',robots:{index:false,follow:false}};
export default function AdminLayout({children}:{children:React.ReactNode}){return children}
