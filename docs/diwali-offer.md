# Diwali offer

The storefront opens a responsive Diwali offer dialog on the homepage after 1.8 seconds. Dismissal is remembered for 24 hours; the persistent Diwali special button reopens it. Account and checkout pages do not auto-open it. Escape and the close button dismiss it; the native dialog confines keyboard focus. Closed forms are removed from the DOM. The artwork adapts from a split desktop panel to a compact mobile image with a scrollable form.

## Claims and customer details

Full name and a ten-digit Indian mobile number are required. Email and marketing consent are optional. Submissions create private records in **Admin → Offer leads**, separate from OTP-verified customer accounts. They never authenticate a visitor or overwrite a customer profile. Anonymous repeat submissions do not overwrite an existing lead's name, email, or consent. The admin can search/filter enquiries, follow up, add private notes, export matching records, archive them, or confirm permanent deletion. Workspace search also finds offer leads.

A random, hashed server-side claim grants an HttpOnly, host-only browser cookie for up to 30 days. No phone/email is included in the cookie or the public catalog. APIs validate names/numbers/email, same origin, server surface, request size and quotas. No SMS is sent by the form. Optional marketing consent records a preference; it does not send messages or connect a marketing provider.

## Eligibility and checkout

The initial campaign offers 25% off the five existing fragrance IDs and complimentary Indian delivery when an eligible discounted item is in the cart. New product IDs require selection in the campaign. Manage enabled state, percentage (1–90), eligible products, schedule and delivery benefit in **Store settings → Festival offer**. Dates use the administrator's local input time and are saved as ISO timestamps. There is no invented campaign end date.

After submission, eligible products show a gold offer ribbon, original price and discounted price. Card sizes, product detail pages, search/wishlist, bag, price sorting and checkout use the same price helper. A 100 ml base/override price is calculated before applying one rounded percentage discount.

Checkout requires the existing OTP sign-in with the mobile number used for the claim. A different signed-in phone does not receive that lead's offer. The server calculates discounts from saved rules and the authenticated customer phone, ignoring client discount/price fields. Unclaimed/ineligible products retain normal prices. Complimentary delivery requires at least one discounted item; normal tax is calculated on the discounted subtotal. Order records include a discount snapshot, and checkout retries remain idempotent. Campaign expiry/disable or archived/deleted leads revoke future eligibility; older orders keep their original totals. Deleting a lead preserves customer accounts and orders. There is no additional single-use restriction during the active campaign.

## Typography and verification

Explicit text sizes across the storefront, login, account, discover and admin styles increased by 2 px, including font shorthands and responsive size expressions. Hidden zero-size text remains hidden. Font sizes changed without scaling images, spacing or icons. New popup and lead controls have their own responsive typography. Navbar structure is unchanged.

Run `npm run test:backend`, `npm run test:offer`, and `npm run test:integration -- --browser`. The offer test uses two disposable servers and fixture data, without changing live customers, stock, orders or SMS delivery. The production build is verified in an isolated copy.

## Artwork

Final workspace asset: [public/images/velora-diwali-offer.webp](../public/images/velora-diwali-offer.webp), 1122 × 1402, WebP quality 92. Created using the built-in image_gen mode with the supplied popup as reference. The source screenshot is unchanged.

Final generation prompt:

> Use case: compositing. Asset type: left-side photographic artwork for an actual responsive Diwali offer popup, not a complete UI mockup. Input reference: supplied Velora Diwali Fragrance Offer screenshot; faithfully match its left photographic half. Create a portrait 4:5 luxury perfume still life: clear rectangular faceted glass fragrance bottle with pale amber pink liquid and a polished gold cylindrical cap, centered lower right on a cream limestone plinth. An ornate glowing brass lantern stands to its left, a small lit terracotta golden diya in the front, delicate white jasmine flowers with olive leaves above left and around the plinth. Warm ivory plaster wall with an arched niche, gentle golden afternoon sunlight, dappled botanical shadows, sophisticated soft cream/champagne palette, realistic fine glass reflections and gold textures. The bottle label reads exactly VELORA, a small FRAGRANCES beneath, and AURORA below. Keep all objects inside frame, no UI, no buttons, no offer headline, no percentage, no borders or watermark. Match the reference photograph's polished warm luxury character.
