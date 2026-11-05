# Compact Aurora login pages

The subsequent ALORA rebrand replaces the text wordmark with the shared transparent `BrandLogo` and uses `public/images/alora-aurora-login.webp` for the current bottle backdrop. Downloadable brand artwork, generation prompts and delivery dimensions are documented in [alora-brand-assets.md](alora-brand-assets.md). The notes below record the original layout and background preparation.

Customer `/account` and administrator `/admin/login` use real forms in `components/auth/AuthShell.tsx`, styled independently in `app/auth.css`. The customer card is at most 460px wide; the administrator card is at most 440px. Their height follows the contents, so validation, custom calling codes, OTP verification and account recovery remain accessible on short screens. Input text stays at 16px to avoid focus zoom on mobile. The country selector, password visibility, remember-me setting, validation and existing authentication endpoints remain functional.

Both pages follow the supplied **Velora Aurora OTP Login.png** and **Velora Fragrances Login with Perfume Bottle.png** references: warm cream photography, green typography and buttons, a centered translucent card, fine gold borders, and the Aurora bottle at the right. Customer screens include a phone/message badge and code-drawn gold waves. The administrator form uses the reference's compact placeholder layout while retaining accessible labels.

## Background asset

Final project asset: [`public/images/velora-aurora-login.webp`](../public/images/velora-aurora-login.webp), 1554 × 1012 pixels, 68,950 bytes. Created with the built-in image generation tool by editing the supplied administrator reference, then encoded as WebP at quality 92. Next Image loads the backdrop with priority and responsive sizing. The original attachment and previous backdrop remain unchanged. Form text, card, wordmark, waves and controls are rendered in HTML/CSS/SVG.

Final prompt (built-in image editing):

> Use case: precise-object-edit. Asset type: high resolution photographic background for a fragrance website's login pages. Edit target: the supplied Velora admin login reference. Remove ONLY the entire center translucent login panel, its border, logo, headings, form controls, and shadow. Reconstruct the underlying smooth warm ivory and peach background seamlessly. Preserve the whole surrounding scene and composition as closely as possible: olive green leaves draping from the top left, delicate sunlight and botanical shadows across the cream wall, reflective warm stone surface below, sharp amber glass VELORA AURORA perfume bottle with gold cylindrical cap standing on a pale round travertine pedestal at lower right with white flowers. Bottle and pedestal must remain in the rightmost quarter of frame; broad negative space across the middle and left. Premium realistic product photography. Retain label text on bottle. No UI, no card, no other added lettering, no watermarks. Wide landscape composition matching the reference, at least full HD quality.

## Verification

`npm run test:split` uses isolated local servers and temporary application data. It checks layouts at 320, 390, 768, 844 (landscape), 1024, 1440 and 1920px, administrator recovery and password visibility, successful administrator sign-in and customer OTP verification, shared inventory/orders, and separate portal/session boundaries. Screenshots are saved under the operating system's temporary `velora-login-review` directory. No production credentials or customer records are used.

Administrator recovery retains the private reset workflow. Remember me controls cookie persistence within the existing eight-hour session limit. The redesign does not change SMS delivery configuration; public SMS still requires the configured provider.
