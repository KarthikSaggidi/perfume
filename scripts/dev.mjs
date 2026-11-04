import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
const production=args.includes('--production');
if(production)args.splice(args.indexOf('--production'),1);
const require=createRequire(import.meta.url);
require('@next/env').loadEnvConfig(root,!production);
function option(names){
 for(let index=0;index<args.length;index++){
  const argument=args[index],name=names.find(value=>argument===value||argument.startsWith(value+'='));
  if(!name)continue;
  if(argument.includes('=')){args.splice(index,1);return argument.slice(name.length+1)}
  const value=args[index+1];if(!value||value.startsWith('-'))throw new Error(`Enter a value for ${name}.`);
  args.splice(index,2);return value;
 }
}
async function available(port,hostname){
 return new Promise((resolve,reject)=>{
  const probe=createServer();probe.once('error',error=>error.code==='EADDRINUSE'?resolve(false):reject(error));
  probe.listen(port,hostname,()=>probe.close(()=>resolve(true)));
 });
}
async function main(){
 const surface=option(['--surface'])||process.env.VELORA_APP_SURFACE||'storefront';
 if(!['storefront','admin','combined'].includes(surface))throw new Error('Choose storefront or admin with --surface.');
 if(surface==='combined'&&(production||process.env.VELORA_INTEGRATION_TEST!=='true'))throw new Error('Combined mode is reserved for isolated tests.');
 const storeUrl=new URL(process.env.VELORA_STOREFRONT_URL||'http://localhost:3001'),adminUrl=new URL(process.env.VELORA_ADMIN_URL||'http://127.0.0.1:3002');
 if(surface!=='combined'&&storeUrl.hostname===adminUrl.hostname)throw new Error('Storefront and admin must use different hostnames to isolate cookies.');
 const url=surface==='admin'?adminUrl:storeUrl;
 const specified=option(['--port','-p'])??process.env.PORT,hostname=option(['--hostname','-H'])||'127.0.0.1';
 const port=Number(specified??(production?(surface==='admin'?3002:3001):(url.port||(url.protocol==='https:'?443:80))));
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Choose a port between 1 and 65535.');
 if(!production&&surface!=='combined'&&port!==Number(url.port||(url.protocol==='https:'?443:80)))throw new Error('The port must match the configured portal URL. Update VELORA_STOREFRONT_URL or VELORA_ADMIN_URL to change it.');
 if(!await available(port,hostname))throw new Error(`Port ${port} is already in use. Stop that server before starting this portal.`);
 // Separate caches prevent parallel Next processes from corrupting route manifests.
 const env={...process.env,NODE_ENV:production?'production':'development',PORT:String(port),VELORA_APP_SURFACE:surface,VELORA_DEV_DIST:process.env.VELORA_DEV_DIST||`.next-dev-${surface}-${port}`};
 console.info(`[Velora ${surface}] ${surface==='combined'?`http://${hostname}:${port}`:url.origin}${surface==='admin'?'/admin/login':''}`);
 const child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),production?'start':'dev','--hostname',hostname,'--port',String(port),...args],{cwd:root,env,stdio:'inherit'});
 let stopping=false;
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopping=true;child.kill(signal)});
 child.on('error',error=>{console.error(error.message);process.exitCode=1});
 child.on('exit',code=>{process.exitCode=stopping?0:code??1});
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
