import {existsSync} from 'node:fs';
import {chmod,readFile,rename,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {stdin,stdout} from 'node:process';
import {createInterface} from 'node:readline/promises';
import {checkSmsConnection,smsStatus} from '../lib/server/sms';
import {phoneValue} from '../lib/server/security';
import {readSecret} from './terminal-input';

for(const file of ['.env.local','.env'])if(existsSync(file))process.loadEnvFile(file);

async function main(){
 if(process.env.NODE_ENV==='production'||process.env.VERCEL)throw new Error('Run this setup on your local development machine.');
 const request=new Request('http://localhost:3001/api/admin/integrations/sms');
 if(process.argv.includes('--check')){
  const state=smsStatus();if(state.missing.length)throw new Error(`SMS is not configured. Missing: ${state.missing.join(', ')}. Run npm run sms:setup.`);
  const result=await checkSmsConnection(request);console.info(`${result.name}: connection verified. Six-digit codes. Scope: ${result.scope}. No SMS was sent.`);return;
 }
 let accountSid:string,authToken:string,serviceSid:string,numbers:string;
 if(process.argv.includes('--stdin')){
  let input='';for await(const chunk of stdin){input+=String(chunk);if(input.length>4096)throw new Error('Input is too large.')}
  const value=JSON.parse(input);accountSid=String(value.accountSid||'').trim();authToken=String(value.authToken||'').trim();serviceSid=String(value.verifyServiceSid||'').trim();numbers=Array.isArray(value.testNumbers)?value.testNumbers.join(','):String(value.testNumbers||'');
 }else{
  console.info('Connect Twilio Verify for localhost SMS. This checks the service without sending a message.');
  const prompt=createInterface({input:stdin,output:stdout});
  accountSid=(await prompt.question('Twilio Account SID (AC…): ')).trim();serviceSid=(await prompt.question('Verify Service SID (VA…): ')).trim();numbers=await prompt.question('Your test mobile numbers, with country codes (comma separated): ');prompt.close();
  authToken=(await readSecret('Twilio Auth Token (hidden): ',256)).trim();
 }
 if(!/^AC[a-f0-9]{32}$/i.test(accountSid))throw new Error('Enter a valid Twilio Account SID beginning with AC.');
 if(!/^VA[a-f0-9]{32}$/i.test(serviceSid))throw new Error('Enter a valid Verify Service SID beginning with VA.');
 if(!/^[a-z0-9_-]{16,256}$/i.test(authToken))throw new Error('Copy your Auth Token from the Twilio Console.');
 const testNumbers=[...new Set(numbers.split(',').map(value=>value.trim()).filter(Boolean).map(phoneValue))];
 if(!testNumbers.length||testNumbers.length>10)throw new Error('Enter one to ten mobile numbers for local testing.');
 const updates:Record<string,string>={TWILIO_ACCOUNT_SID:accountSid,TWILIO_AUTH_TOKEN:authToken,TWILIO_VERIFY_SERVICE_SID:serviceSid,VELORA_SMS_MODE:'twilio',VELORA_SMS_SCOPE:'localhost',OTP_TEST_NUMBERS:testNumbers.join(',')};
 Object.assign(process.env,updates);
 const service=await checkSmsConnection(request);
 let contents='';try{contents=await readFile('.env.local','utf8')}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error}
 for(const [key,value] of Object.entries(updates)){
  const pattern=new RegExp(`^${key}=.*$`,'m');contents=pattern.test(contents)?contents.replace(pattern,`${key}=${value}`):`${contents.trimEnd()}\n${key}=${value}\n`;
 }
 const temporary=`.env.local-sms-${randomUUID()}`;
 try{await writeFile(temporary,contents.trimStart(),{mode:0o600});await rename(temporary,'.env.local');await chmod('.env.local',0o600)}catch(error){const {unlink}=await import('node:fs/promises');await unlink(temporary).catch(()=>{});throw error}
 console.info(`${service.name} is connected. Credentials were saved privately in .env.local.\nSMS is restricted to localhost and your ${testNumbers.length} test number${testNumbers.length===1?'':'s'}.\nRestart npm run dev -- --port 3001, then sign in at http://localhost:3001/account.\nNo SMS was sent by this setup command.`);
}
main().catch(error=>{console.error(error instanceof Error?error.message:'SMS setup failed.');process.exitCode=1});
