import {handleAuth} from '@/lib/server/auth-api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{segments:string[]}>}){return handleAuth(request,(await params).segments)}
export const POST=GET;
