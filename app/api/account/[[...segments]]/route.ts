import {handleAccount} from '@/lib/server/account-api';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{segments?:string[]}>}){return handleAccount(request,(await params).segments||[])}
export const POST=GET;
export const PATCH=GET;
export const DELETE=GET;
