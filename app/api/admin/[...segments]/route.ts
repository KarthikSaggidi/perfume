import {handleAdmin} from '@/lib/server/admin-api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{segments:string[]}>}){return handleAdmin(request,(await params).segments)}
export const POST=GET;
export const PATCH=GET;
export const DELETE=GET;
