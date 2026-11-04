import {appSurface,assertSeparateOrigins} from '../lib/app-surface';

// Leave local builds and integration fixtures independent of hosted secrets.
// On Vercel, reject an incomplete production configuration before promotion.
if(process.env.VERCEL==='1'&&process.env.VERCEL_ENV==='production'){
 try{
  Object.assign(process.env,{NODE_ENV:'production'});
  if(!['storefront','admin'].includes(process.env.VELORA_APP_SURFACE||''))throw new Error('Set VELORA_APP_SURFACE to storefront or admin.');
  appSurface();assertSeparateOrigins();
  if(!process.env.DATABASE_URL)throw new Error('Configure the shared production PostgreSQL DATABASE_URL.');
  const database=new URL(process.env.DATABASE_URL);
  if(!['postgres:','postgresql:'].includes(database.protocol))throw new Error('DATABASE_URL must be a PostgreSQL connection URL.');
  console.info('Production portal and persistent-storage configuration verified.');
 }catch(error){
  // Validation messages never include the URL's credentials.
  console.error('[Velora deployment] '+(error instanceof Error&&error.message!=='Invalid URL'?error.message:'Check the production URL configuration.'));
  process.exitCode=1;
 }
}
