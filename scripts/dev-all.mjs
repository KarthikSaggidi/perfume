import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),production=process.argv.includes('--production');
const children=['storefront','admin'].map(surface=>spawn(process.execPath,['scripts/dev.mjs','--surface',surface,...(production?['--production','--port',surface==='admin'?'3002':'3001']:[])],{cwd:root,env:process.env,stdio:'inherit',detached:true}));
let stopping=false;
function stop(signal='SIGTERM'){if(stopping)return;stopping=true;for(const child of children)if(child.pid)try{process.kill(-child.pid,signal)}catch{};}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop(signal));
for(const child of children){child.on('error',error=>{console.error(error.message);process.exitCode=1;stop()});child.on('exit',code=>{if(!stopping){process.exitCode=code||1;stop()}})}
