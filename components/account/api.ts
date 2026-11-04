export class AccountApiError extends Error{
  constructor(message:string,public status:number,public retryAfter?:number){super(message);this.name='AccountApiError'}
}
export async function accountRequest<T>(url:string,options:RequestInit={}):Promise<T>{
  const response=await fetch(url,{...options,credentials:'same-origin',cache:'no-store',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
  let data:Record<string,unknown>={};
  try{data=await response.json()}catch{}
  if(!response.ok){const message=typeof data.error==='string'?data.error:typeof data.message==='string'?data.message:'We couldn’t complete that request. Please try again.';const retryAfter=Number(data.retryAfter||response.headers.get('Retry-After')||0);throw new AccountApiError(message,response.status,Number.isFinite(retryAfter)?retryAfter:undefined)}
  return data as T;
}
export const accountError=(error:unknown)=>error instanceof Error?error.message:'Something went wrong. Please try again.';
export const notifyAccountChange=()=>window.dispatchEvent(new Event('velora-auth-change'));
export function safeAccountReturnTo(value:string|null){
  if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return '/account';
  try{const target=new URL(value,'https://velora.local');const decoded=decodeURIComponent(target.pathname);if(target.origin!=='https://velora.local'||decoded.startsWith('//')||decoded.includes('\\')||['/api','/admin','/account'].some(path=>decoded===path||decoded.startsWith(path+'/')))return '/account';return `${target.pathname}${target.search}${target.hash}`}catch{return '/account'}
}
