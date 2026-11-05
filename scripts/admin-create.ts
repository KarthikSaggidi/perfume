import {existsSync} from 'node:fs';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {randomUUID} from 'node:crypto';
import {audit,database,localStorageAllowed,mutateStore} from '../lib/server/store';
import {emailValue,hashPassword,requiredText,usernameValue} from '../lib/server/security';
import {readSecret} from './terminal-input';
for(const file of ['.env.local','.env'])if(existsSync(file))process.loadEnvFile(file);
async function main(){
 let email:string,name:string,password:string,username:string|undefined;
 const usernameIndex=process.argv.indexOf('--username');if(usernameIndex>=0)username=usernameValue(process.argv[usernameIndex+1]);
 const allowShort=process.argv.includes('--allow-short-local-password');
 if(allowShort&&(process.env.NODE_ENV==='production'||process.env.VERCEL||!localStorageAllowed()))throw new Error('Short-password setup is available only for local development.');
 if(process.argv.includes('--stdin')){let input='';for await(const chunk of stdin){input+=String(chunk);if(input.length>4096)throw new Error('Input is too large.')}const value=JSON.parse(input);email=emailValue(value.email,true);name=requiredText(value.name||'Store owner','a name',100,2);password=typeof value.password==='string'?value.password:'';if(value.username!==undefined)username=usernameValue(value.username)}
 else{const readline=createInterface({input:stdin,output:stdout});email=emailValue(await readline.question('Administrator email: '),true);name=requiredText(await readline.question('Administrator name: '),'a name',100,2);readline.close();password=await readSecret(`Password (${allowShort?8:12}–128 characters; hidden): `);const confirmation=await readSecret('Confirm password (hidden): ');if(password!==confirmation)throw new Error('Passwords do not match.')}
 const passwordHash=await hashPassword(password,{minimumLength:allowShort?8:12}),reset=process.argv.includes('--reset');
 await mutateStore(state=>{const existing=state.admins.find(admin=>admin.email===email),now=new Date().toISOString();if(username&&state.admins.some(admin=>admin.id!==existing?.id&&(admin.username?.toLowerCase()===username||admin.email.toLowerCase()===username)))throw new Error('This username is already in use.');if(existing){if(!reset)throw new Error('This administrator already exists. Use --reset to reset the password.');existing.passwordHash=passwordHash;if(username)existing.username=username;existing.name=name;existing.active=true;existing.updatedAt=now;state.sessions=state.sessions.filter(session=>session.kind!=='admin'||session.subjectId!==existing.id);audit(state,'Server operator','Reset administrator access',email)}else{if(state.admins.length&&!reset)throw new Error('An owner already exists. Add team members from Team & access.');state.admins.push({id:randomUUID(),email,name,...(username?{username}:{}),passwordHash,role:'owner',active:true,createdAt:now,updatedAt:now});audit(state,'Server operator','Created owner',email)}});
 console.info(`Administrator ready: ${username?`${username} (${email})`:email}\nSign in at /admin/login. Your password has not been printed or stored in plain text.`);
 if(process.env.DATABASE_URL)await database().end();
}
main().catch(async error=>{console.error(error instanceof Error?error.message:'Setup failed.');if(process.env.DATABASE_URL)await database().end().catch(()=>{});process.exitCode=1});
