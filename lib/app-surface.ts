export type AppSurface='storefront'|'admin'|'combined';

/** combined is reserved for the isolated integration harness. Normal servers fail closed. */
export function appSurface():AppSurface {
 const value=process.env.VELORA_APP_SURFACE;
 if(value==='combined'&&process.env.NODE_ENV!=='production'&&process.env.VELORA_INTEGRATION_TEST==='true')return value;
 if(value==='admin'||value==='storefront')return value;
 if(value)throw new Error('VELORA_APP_SURFACE must be storefront or admin.');
 return 'storefront';
}

export function surfaceOrigin(surface:'storefront'|'admin') {
 const configured=surface==='admin'?process.env.VELORA_ADMIN_URL:process.env.VELORA_STOREFRONT_URL;
 if(!configured&&process.env.NODE_ENV==='production')throw new Error(`Configure VELORA_${surface==='admin'?'ADMIN':'STOREFRONT'}_URL for this deployment.`);
 const url=new URL(configured||(surface==='admin'?'http://127.0.0.1:3002':'http://localhost:3001'));
 if(url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('Portal URLs must contain only an origin.');
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&local&&url.protocol==='http:'))throw new Error('Use HTTPS portal origins, or HTTP loopback origins for local development.');
 return url;
}

export function assertSeparateOrigins(){
 const store=surfaceOrigin('storefront'),admin=surfaceOrigin('admin');
 // Cookies are scoped by hostname, never by port. Require separate cookie hosts.
 if(store.hostname===admin.hostname)throw new Error('Use different storefront and admin hostnames so their session cookies stay separate.');
}

const within=(path:string,root:string)=>path===root||path.startsWith(root+'/');
export function surfaceAllowsPath(path:string,surface=appSurface()) {
 if(surface==='combined')return true;
 if(surface==='storefront')return !within(path,'/admin')&&!within(path,'/api/admin')&&!within(path,'/api/auth/admin');
 return within(path,'/admin')||within(path,'/api/admin')||within(path,'/api/auth/admin')||path==='/api/auth/session'||path==='/api/catalog'||within(path,'/api/media')||within(path,'/_next')||within(path,'/images')||['/icon.svg','/favicon.ico'].includes(path);
}

export function identityAllowed(kind:'admin'|'customer',surface=appSurface()) {
 return surface==='combined'||(kind==='admin'?surface==='admin':surface==='storefront');
}
