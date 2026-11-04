import {loadMedia} from '@/lib/server/store';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const media=await loadMedia((await params).id);if(!media)return new Response('Not found',{status:404});return new Response(new Uint8Array(media.bytes),{headers:{'Content-Type':media.mime,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}})}catch{return new Response('Media unavailable',{status:503})}}
