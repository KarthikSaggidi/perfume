# AURÉALIS

A responsive fragrance storefront built with Next.js App Router, TypeScript, Tailwind CSS, Motion, Three.js, and Lucide.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Next.js. Validate and run production with:

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

Development uses `.next`; production uses `.next-production`, so build checks do not overwrite a running development preview.

## Pages

- `/`: the portrait-led homepage matching the latest reference: campaign hero, five category tiles, four bestsellers, a Noir signature banner, occasion and gift features, fragrance notes, trust strip, newsletter preview, and a multi-column footer.
- `/shop` (also `/products`): the filterable fragrance collection.
- `/collections`: five curated edits, each with its own `/collections/[slug]` page.
- `/about`: the brand concept and philosophy.
- `/help` and `/privacy`: customer guidance and current demo data-handling information.
- `/checkout`: a validated delivery form, editable bag summary, and local review flow, without payment collection.
- `/journal`: three editorial articles, each with its own `/journal/[slug]` page.
- `/products/noir`, `/products/ocean`, `/products/amber`, `/products/flora`, `/products/velvet`: detailed product experiences, notes, quantity, wishlist, cart, and a nine-chapter animated fragrance story.

All pages share `components/ProductCommerce.tsx`, `components/SiteHeader.tsx`, and `components/SiteFooter.tsx`. The final reference direction is styled in `app/atelier.css`, layered over the existing shared component styles. Search, wishlist, account information, and the cart open accessible panels. Mobile navigation includes secondary account and wishlist actions.

## Artwork and 3D

`public/images/reference-design.png` is an unchanged copy of the supplied reference. `components/ReferenceImage.tsx` uses CSS crops to display source artwork. The current homepage uses a clean, generated recreation of the latest portrait photograph in `public/images/portrait-hero.png`, with live headline and controls. The detailed product pages retain the separately recreated Three.js bottle, not a scan or exact 3D reconstruction of a flattened image.

The live model has a rounded rectangular glass body, coloured liquid, transparent gold lettering, a metallic atomizer, diamond-textured cap, and static condensation detail. The cap remains closed and the bottle rotates continuously once every 60 seconds. No spray or mist system runs in the 3D view. Pause/resume controls and reduced-motion support are provided. Offscreen/inactive scenes stop rendering; frame rate and device pixel ratio are capped; resources are disposed on unmount. A static fallback appears when WebGL is unavailable.

`public/images/lounge-backdrop.png` is an AI-generated, bottle-free interpretation of the source hero environment, used behind the live model. `public/images/collection-art.png` is a clean, generated four-scene asset sheet for the collection and editorial pages, with live text rendered by the site. Earlier campaign assets remain in the repository for reference.

## Data and interactions

Product identities, prices and notes are in `lib/products.ts`; richer descriptions are in `lib/product-details.ts`. The reference-inspired names are Noir Legacy, Titan, Ember, and Verde, alongside Velvet Bloom. Existing product IDs and cart format are preserved.

`lib/use-cart.ts` persists quantities in `aurealis-cart`; wishlists use `aurealis-wishlist`. Both are local device storage. Quantity changes, removal, subtotal, filtering, search, and related-product navigation work locally. Only the 50 ml demonstration size is offered.

## Launch limitations

Products, descriptions, prices, and articles are demonstration content, not verified inventory or formulas. No fabricated ratings, purchase reviews, clinical safety claims, or longevity guarantees are added. The delivery form and review flow at `/checkout` work as a local preview. Real ordering, payments, authentication, fulfilment, and account order history are not connected. Form details stay in component memory and are never sent or persisted. The Gift Edit contains individual bottles; gift-box bundles and wrapping are not offered.

The 15-second product story is an interactive animation, not an MP4, and includes no audio or voiceover. Reduced-motion users can select chapters manually.

Before launch, supply verified inventory, full-resolution standalone product assets, ingredient declarations, real policies, a commerce backend, payment integration, and a production origin for canonical metadata. The supplied flattened reference artwork limits the resolution of its CSS-cropped images.

## Final polish

`app/refinements.css` adds the darker photographic background, clearer panel contrast, refined type, product hover treatments, a journal preview, and responsive service and checkout layouts. `public/images/product-campaigns.png` contains four newly generated product campaign photographs; `ReferenceImage.tsx` displays their matching regions with preserved image proportions. The original hero artwork remains available. Unknown routes show a themed recovery page.

## Latest reference layout

`public/images/collection-reference-v2.png` retains the latest supplied 837 × 1879 mockup. `components/AtelierImage.tsx` displays selected artwork without embedding the screenshot as the page. Headings, links, cards, navigation and forms are live HTML. The homepage hero is photographic; product detail pages retain the closed-cap 60-second 3D turn with no spraying.

`/ingredients` explains bergamot, sandalwood and amber as fragrance notes, rather than making unverified formula claims. The newsletter signup is an email-validating local preview; the email is not stored or sent. Footer links lead to implemented collection, editorial, help, privacy and checkout-preview pages. Fabricated ratings, original prices, clinical claims and unconfigured free-shipping promises from the visual mockup are not reproduced.

The final category, ingredient, and lower editorial imagery is provided by clean generated `notes-atlas.png` and `editorial-atlas.png` asset sheets. `AtelierImage.tsx` preserves proportions while cropping each scene, so the live page does not enlarge tiny mockup thumbnails or contain baked-in text. The supplied reference remains preserved separately.

## Supplied hero campaigns and final shopping flow

The homepage now uses all five user-supplied banners directly and unchanged, copied to `public/images/banners/`. `CampaignCarousel.tsx` keeps their complete aspect ratio and baked-in artwork/text, rather than adding duplicate overlay copy. Each image is an accessible link to a relevant collection. The carousel advances every seven seconds, supports swipe, keyboard arrows, pagination and previous/next controls, pauses on hover, keyboard focus, or when offscreen, and provides an explicit pause control. Reduced-motion users receive manual navigation. Small screens retain the complete artwork and get a readable caption and link below it.

The shared navbar is sticky, with an active state, search, wishlist, bag, and Escape-dismissable mobile navigation. `/shop` and `/products` support search, family filtering, four sort orders, reset/empty states and live result counts. Product detail pages can switch between the no-spray 3D bottle and the appropriate campaign photograph; related cards share the same add-to-bag controls.

Checkout has contact and India delivery fields, a six-digit PIN check, live quantity/removal and subtotal, delivery review/edit, and an explicit demo completion state. Payment due now is zero; tax and shipping are explicitly unconfigured rather than invented. Nothing is sent to a server or persisted from the delivery form. A real payment/order integration is still required before launch. `campaign-theme.css` supplies the final cohesive marble, warm-gold and olive-charcoal styling.

Campaign banner labels such as Ocean Breeze or Oud Elixir represent supplied marketing concepts, not additional verified inventory. Their buttons lead to matching fragrance-family collections.

All five catalog products now use matching photographic campaign assets, including `velvet-campaign.png`. Cart, checkout, wishlist, search, product cards, and product image galleries use the correct product image rather than substituting another scent. The 3D bottle lettering also matches the photographed bottle names.

## Current neutral glossy finish

`app/gloss.css` replaces the dark-green UI surfaces with neutral smoked charcoal, reflective warm glass, and champagne details across navigation, product pages, collections, forms, checkout, drawers and footer. The photographic background blur is 8 px on desktop and 6 px on phones, reduced from 24 px. Natural greens in the supplied campaign photographs are preserved.

The homepage keeps the supplied banner files unchanged. Mobile now shows only the banners: the lower controls/caption panel has been removed, while touch/swipe and autoplay remain. Desktop arrows, progress indicators, and counter float over the artwork with a transparent background; the pause button has been removed. Autoplay still pauses on hover, keyboard focus, when offscreen, and for reduced-motion preferences.

Shop cards now include each product’s character, notes, size, price, wishlist, add-to-cart feedback, and a direct fragrance-details link. The desktop catalog presents all five photographed products in a balanced row, adapting to three and two columns on smaller screens.

## Viewport fitting

`app/responsive.css` is the final sizing layer. It defines fluid shared page gutters, bounded large-screen content, minmax-based grids, proportionate campaign artwork, wrapped category tiles, readable phone cards, stacked narrow delivery fields, and landscape adjustments. Small screens keep normal vertical scrolling without a horizontal category rail or page overflow. The responsive audit covered eight page types at 320, 360, 390, 430, 600, 768, 820, 980, 1024, 1280, 1440, 1920, and 2560 pixels, plus 568×320 and 844×390 landscape layouts.

## Minimal product detail experience

`components/ProductExperience.tsx` now presents a photo-first gallery with close-up and opt-in slow 3D views, selected-product purchase information, size and quantity controls, product specifications, top/heart/base notes, wearing/composition/delivery guidance, fragrance-family-ranked recommendations, and then ratings and reviews. The oversized nine-scene storyboard and campaign blocks are no longer part of product pages. Styling is isolated in `app/product-detail.css`.

`components/ProductReviews.tsx` and `lib/reviews.ts` provide a clearly labelled local review preview per product: star input, validated name/title/body, local persistence, aggregate rating, rating distribution, filtering, sorting and deletion. No sample reviews or verified-purchase claims are fabricated. The default state is unrated. Reviews are stored only in this browser under `aurealis-reviews:<productId>` and are never sent to a server. This requires a real reviews backend and moderation before a public launch. Privacy/help text describes the preview storage.
