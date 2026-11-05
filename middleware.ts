import {NextResponse,type NextRequest} from 'next/server';
import {appSurface,assertSeparateOrigins,surfaceAllowsPath,surfaceOrigin} from './lib/app-surface';

export function middleware(request:NextRequest){
 try {
  const surface=appSurface();
  if(surface==='combined')return NextResponse.next();
  // Next's image optimizer requests public source images internally without a
  // Host header. These GET-only assets contain no session or private API data.
  const publicImage=request.nextUrl.pathname.startsWith('/images/')||request.nextUrl.pathname.startsWith('/brand/')||/^\/api\/media\/[a-f0-9-]{36}$/.test(request.nextUrl.pathname);
  if(publicImage&&['GET','HEAD'].includes(request.method))return NextResponse.next();
  assertSeparateOrigins();
  const canonical=surfaceOrigin(surface),host=request.headers.get('host')||'';
  if(host.toLowerCase()!==canonical.host.toLowerCase()){
   return new NextResponse(`Use ${canonical.origin}${surface==='admin'?'/admin/login':'/'} to open this application.`,{status:421,headers:{'Cache-Control':'no-store'}});
  }
  if(surface==='admin'&&request.nextUrl.pathname==='/')return NextResponse.redirect(new URL('/admin',canonical));
  if(!surfaceAllowsPath(request.nextUrl.pathname,surface)){
   return request.nextUrl.pathname.startsWith('/api/')?NextResponse.json({error:'Not found.'},{status:404,headers:{'Cache-Control':'no-store'}}):new NextResponse('Not found.',{status:404,headers:{'Cache-Control':'no-store'}});
  }
  const response=NextResponse.next();
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy',surface==='admin'?'no-referrer':'strict-origin-when-cross-origin');
  if(surface==='admin'){
   response.headers.set('X-Frame-Options','DENY');
   response.headers.set('Content-Security-Policy',"frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
   response.headers.set('X-Robots-Tag','noindex, nofollow');
   response.headers.set('Cache-Control','no-store');
  }
  return response;
 }catch{
  return new NextResponse('Application address configuration is incomplete.',{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
