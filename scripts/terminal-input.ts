import {stdin,stdout} from 'node:process';

export async function readSecret(prompt:string,maxLength=128):Promise<string>{
 if(!stdin.isTTY)throw new Error('Use an interactive terminal, or pass JSON securely through stdin with --stdin.');
 const wasRaw=stdin.isRaw;
 stdin.setRawMode(true);stdin.resume();stdout.write(prompt);
 return new Promise((resolve,reject)=>{
  let value='';
  const cleanup=()=>{stdin.off('data',input);stdin.setRawMode(Boolean(wasRaw));stdin.pause();stdout.write('\n')};
  const input=(buffer:Buffer)=>{
   const entered=buffer.toString('utf8').replace(/\u001b\[[0-?]*[ -/]*[@-~]/g,'');
   for(const character of entered){
    if(character==='\u0003'||character==='\u0004'){cleanup();reject(new Error('Cancelled.'));return}
    if(character==='\r'||character==='\n'){cleanup();resolve(value);return}
    if(character==='\u007f'||character==='\b'){value=Array.from(value).slice(0,-1).join('');continue}
    if(character==='\u0015'){value='';continue}
    if(character.charCodeAt(0)>=32&&value.length+character.length<=maxLength)value+=character;
   }
  };
  stdin.on('data',input);
 });
}
