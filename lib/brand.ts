export const brandName='ALORA';
export const brandTagline='Your Scent. Your Signature.';

/** Older saved default settings adopt the requested brand; custom names stay editable. */
export function currentStoreName(name:string){return /^velora(?: fragrances)?$/i.test(name.trim())?brandName:name;}

/** Resolve built-in artwork saved before the rebrand without changing custom uploads. */
export function currentBrandImage(image:string){return image.replace(/^\/images\/velora-(hero|portrait|story|bloom|noir|celeste|oud|diwali-offer|aurora-login)\.webp$/, '/images/alora-$1.webp');}
