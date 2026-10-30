# Velora reference update

The storefront follows the supplied **Velora Luxury Fragrance Experience (1).png** composition. The desktop navigation is a complete cream bar above the panoramic hero. The page includes five benefits, six collection cards, four product cards beside a portrait story panel, and a separate mobile composition with a centered wordmark, menu, horizontal products, experience strip, and bottom navigation.

Product IDs and existing browser cart storage remain compatible. Both 50 ml and 100 ml bottles are selectable; sizes have separate cart lines and prices, and checkout preserves the selected variant. The 100 ml demonstration price is 1.6 times the 50 ml price, rounded to a whole rupee. Marketing metrics and catalog ratings reproduce the supplied concept reference; they are illustrative. Payments and fulfilment remain unconnected.

## Current artwork

Generated using the **built-in ImageGen tool**. WebP conversions preserve the original pixel dimensions and are used by the application.

| Saved project path | Dimensions | Use |
| --- | --- | --- |
| `public/images/velora-hero.webp` | 2048 × 768 | Full HD panoramic desktop hero |
| `public/images/velora-portrait.webp` | 1030 × 1526 | Mobile hero |
| `public/images/velora-story.webp` | 1030 × 1526 | Desktop story panel; same portrait master |
| `public/images/velora-bloom.webp` | 1254 × 1254 | Bloom product and floral collection |
| `public/images/velora-noir.webp` | 1254 × 1254 | Noir Essence product and signature collection |
| `public/images/velora-celeste.webp` | 1254 × 1254 | Celeste product and fresh collection |
| `public/images/velora-oud.webp` | 1254 × 1254 | Oud Royale product |
| `public/images/velora-gourmand.webp` | 1536 × 1024 | Vanilla ingredient collection |

## Generation prompts

### Desktop hero

Use case: ads-marketing. The attached image is a STYLE AND COMPOSITION REFERENCE. Generate a CLEAN PHOTOGRAPHIC BACKGROUND matching ONLY the desktop HERO PHOTOGRAPH in its upper-left desktop website, remove ALL website/UI/headlines/buttons/sidebar/statistics. NOT a website mockup, NOT a collage, NOT a phone. Output one ultra wide 2400x900 luxury fragrance campaign photograph. Closely reproduce the reference hero scene: a completely visible square faceted transparent perfume bottle containing pale peach liquid, polished reflective cylindrical GOLD cap with black top, tilted slightly clockwise on layered natural beige limestone slabs in shallow reflective water. Bottle label text exactly 'VELORA', small 'FRAGRANCES', 'AURORA', tiny 'EAU DE PARFUM'. Position bottle centered at 61% image width, bottle from 52% to72% width and 13% to88% height. A large rough warm stone arch frames the bottle, hazy coastal mountains visible through arch, sunrise champagne light. White orange blossoms, a few pink blossoms, glossy leaves, dark sculptural oud branches, a sliced green lime around base. LEFT 35% of composition has soft bright ivory haze and distant terraces/water, calm usable negative space for black text. RIGHT 18% darker warm brown atmospheric stone for sidebar text overlay. Photorealistic 3D luxury cosmetics campaign, exceptional crisp glass edges, caustics and realistic rock texture. Restrained warm beige, honey gold, peach and fresh green. Crucial: no text except the bottle label, no UI, no typography overlays, no navigation, no circles/buttons, no grid, no phone, no borders, no watermark. Match the reference photograph rather than inventing a different scene.

### Product photographs

Common prompt, with each row substituted for COLOR, NAME, and SCENE:

Use case: product-mockup. Create ONE square premium luxury perfume campaign photograph, 1600x1600, for an ecommerce product card. Perfectly centered, fully visible elegant rectangular thick faceted glass bottle with COLOR liquid and smooth cylindrical polished GOLD cap with black top (NOT textured), like the luxury Velora reference. Exact front lettering 'VELORA', tiny 'FRAGRANCES', product name 'NAME', tiny 'EAU DE PARFUM'. Bottle occupies 65% image height, including cap, and 56% image width. Setting: SCENE. Hyperreal product photograph, crisp glass refractions, elegant finely engraved label lettering, beautiful depth and material detail. Keep complete bottle inside frame. Luxury perfume commercial art direction. NO website UI, NO badges, NO hearts, NO captions or price text, NO border, NO collage, NO watermark. All text confined to the bottle label.

| NAME | COLOR | SCENE |
| --- | --- | --- |
| BLOOM | clear rose-pink | pink peony blossoms and rose petals, luminous blush pink and cream architectural background, pink reflective shallow water, gently floating petals |
| NOIR ESSENCE | deep black | sculptural dark oud wood, tiny golden sparks, warm golden amber light, cinematic black and gold architectural background, glossy black reflective water |
| CELESTE | pale transparent botanical green | white jasmine blossoms, sliced lime, glossy fresh green leaves, clean luminous sunlit cream and pale green architectural background, clear water reflections |
| OUD ROYALE | deep amber | oud wood, amber crystals and saffron, tiny warm gold sparks, cinematic glowing orange-brown stone architectural background, amber water reflections |

### Mobile hero and story

Use case: ads-marketing. Attached image is style reference for a mobile perfume website. Generate ONE portrait 1080x1600 photographic campaign background, NOT UI, NOT a phone. Match the mobile hero photograph on the RIGHT side of reference. A fully visible square faceted glass perfume bottle containing pink peach liquid tilted slightly clockwise, polished reflective smooth GOLD cylindrical cap with BLACK top. Front text exactly 'VELORA', small 'FRAGRANCES', 'AURORA', tiny 'EAU DE PARFUM'. Bottle centered at x57%, occupies x25%-83%, y21%-59% including cap and base. Bottle rests on natural dark stone and beige limestone in shallow water, surrounded by pink flowers, a few white blossoms, glossy leaves and sculptural dark oud wood. Majestic sunlit mountain valley and warm stone arch behind. Top15% atmospheric pale sky and architecture suitable for black website logo overlay. Bottom35% dark, softly blurred warm black-brown foreground and bokeh petals, uncluttered and suitable for white heading and paragraph overlay. Premium photorealistic luxury fragrance commercial, realistic glass refraction, suspended petals, amber reflections, peach and gold sunrise lighting. Crucial entire bottle fully visible in upper two thirds of frame, bottom third reserved as atmospheric dark space. NO UI, NO webpage typography, NO headlines, NO buttons, NO phone frame, NO collage, NO watermark. Only text is the bottle label.

### Gourmand collection

Use case: ads-marketing. ONE clean high resolution luxury fragrance ingredient photo, landscape 1536x1024. Match the Velora Gourmand collection reference: exquisite ivory vanilla orchid blossoms and glossy long dark vanilla pods, thin natural pale wood slivers, softly curled tan vanilla bark, arranged diagonally on a warm cream satin and amber background with golden afternoon sunlight. One large beautiful white orchid with soft yellow center at middle-right and vanilla pods stretching toward upper-right, warm shadows in lower-left suitable for white text overlay but no actual text. Photorealistic editorial botanical macro photography, exceptional petal veining and realistic vanilla textures, rich black/tan/ivory color palette. Premium perfume campaign. No bottle, no typography, no logo, no watermark, no UI, no border.

## Validation

- `npm run build` passed, including type checks and all 30 generated pages.
- Browser verification passed for cart size variants and prices, quantity changes, reload persistence, checkout totals, wishlist, search, catalog filters/sorting, product size selection, 3D rendering, ambient audio, and mobile-menu navigation.
- All 72 route/viewport combinations passed at widths 320, 390, 768, 1024, 1440, and 1920 pixels, with no horizontal overflow or browser runtime errors.
- Keyboard checks confirmed drawer focus trapping and return to the triggering search/bag control on Escape.
