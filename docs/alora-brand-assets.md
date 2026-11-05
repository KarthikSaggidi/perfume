# ALORA brand assets

The supplied identity reads **ALORA**, with an amber perfume bottle forming the **O**, metallic gold serif lettering, a sweeping R, and the tagline **Your Scent. Your Signature.**

The built-in image generation tool restored the supplied raster reference and extracted a transparent logo. A second image edit created the white presentation, and a bottle-only variant supplies browser icons. Source artwork remains in the image-generation output directory. PNG/WebP delivery exports were encoded with Sharp; the transparent master was generated at 1905 × 826 and resized slightly to 1920 × 833. The white presentation was generated at 1672 × 941 and exported on a 1920 × 1080 white canvas. These are raster exports, not vector artwork.

## Downloadable assets

- [`alora-logo-white-full-hd.png`](../public/brand/alora-logo-white-full-hd.png): 1920 × 1080, with a white background.
- [`alora-logo-transparent.png`](../public/brand/alora-logo-transparent.png): 1920 × 833, genuine alpha transparency.
- [`alora-logo-transparent.webp`](../public/brand/alora-logo-transparent.webp): optimized transparent website asset.
- [`alora-icon.png`](../public/brand/alora-icon.png): 512 × 512 bottle emblem.
- [`alora-apple-touch-icon.png`](../public/brand/alora-apple-touch-icon.png): 180 × 180 touch icon.

The exact prompts are recorded in [`alora-image-prompts.json`](alora-image-prompts.json). Mode: built-in image editing; no external image API credentials were used.

## Website integration

`components/BrandLogo.tsx` is the shared wordmark. `app/brand.css` sizes it for the navbar, footer, login, administrator sidebar/loading screens, festival popup, CSS bottle and printed reports. The WebGL bottle draws the same master into its label texture. Root metadata and public favicon use the new identity. Visible brand copy and page titles are ALORA.

Eight image edits update printed bottle labels in the desktop hero, mobile portrait, Bloom, Noir Essence, Celeste, Oud Royale, login backdrop and festival artwork. The story card reuses the portrait artwork. Optimized derivatives live under `public/images/alora-*.webp`; previous artwork remains available for rollback. Generic unbranded ingredient and reward illustrations are preserved.

Legacy default store names and built-in image paths are normalized when stored records are read. Custom merchant names, external images and uploaded media remain editable. Session keys, database tables, deployment variables, existing staff email/login identities, order numbers, SKUs and customer details retain their existing identifiers to preserve compatibility. Updating local source does not publish a production deployment.

## Verification

Backend tests cover legacy name/image compatibility and existing security/commerce behavior. Browser fixtures exercise both portal surfaces, optimized logo delivery, responsive navigation and logins, admin dashboard and reports, account OTP sign-in, orders, inventory and independent sessions. Visual evidence is written to the temporary `velora-login-review` directory. The integration suite also checks offers, checkout and administrative workflows.
