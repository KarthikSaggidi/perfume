import {publicCatalog} from '@/lib/server/catalog';
import {apiError,json} from '@/lib/server/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return json(await publicCatalog())}catch(error){return apiError(error)}}
