# Customer account dashboard

The signed-in account page follows **Velora Premium Account Dashboard.png**: a profile/sidebar, four actual order/wishlist counters, recent orders, quick actions, favourite previews, account details, and membership banners. Layouts adapt from a desktop sidebar and two-column panels to scrollable mobile navigation and stacked panels.

`components/SiteHeader.tsx` is unchanged. Its SHA-256 remains `18de06662bb4eaac385467728a44371b789146b48691db042fdf585fac4329a5`. Only the account control's desktop-specific styling was aligned to the existing mobile circle, right alignment, and dropdown. The same `AccountMenu` component supplies the options on both sizes.

## Connected account features

- Orders, completed/progress counts, profile information, saved addresses, and favourites use the authenticated customer's records. Empty states and counts are not seeded from the mockup. Overview hearts remove a saved fragrance through the wishlist API.
- Payment Methods shows the store's actual cash-on-delivery availability. Card/UPI processing and card storage are not connected; card numbers are never collected.
- Saved Favourites and Wishlist are two entry points to the same saved collection.
- My Reviews supports creating, editing, and deleting account feedback for a customer's delivered purchases. Only the owning customer can change it. Account reviews do not alter public product ratings or the separate browser-local review preview.
- Notifications lists actual order events and saves marketing consent. Saving a preference does not connect a delivery provider.
- Security & Login explains OTP authentication and allows revoking all sessions for the current customer. Other customers and administrators remain signed in.
- Velora Rewards records a free membership and the customer's explicit communication preference. Joining is idempotent. Points earning, redemption, and discounts are not implemented or promised by the UI.
- Phone verification reflects the OTP account login. Email is not marked verified because email verification is not connected.

Optional `reviews` and `rewardsJoinedAt` fields preserve existing stored customer records. The APIs enforce authentication, record ownership, valid delivered purchases, input limits, and same-origin mutations. Membership, preferences, and reviews persist through the existing store adapter.

## Artwork

Final project asset: [`public/images/velora-account-rewards.webp`](../public/images/velora-account-rewards.webp), encoded as WebP at quality 90 and 800 px wide. Created with the built-in `image_gen` tool using the supplied dashboard screenshot as the composition reference. The original attachment is unchanged. The empty-order parcels and pale botanical footer are native SVG graphics.

Final generation prompt:

> Use case: compositing. Asset type: small fragrance membership promotional background for an existing account dashboard. Reference image: the supplied Velora Premium Account Dashboard screenshot, specifically the small peach card at bottom left with a perfume bottle and white botanical flowers. Create only that card's clean photographic/illustrative background, not the dashboard or any user interface. Landscape 4:3 image, pale ivory blush and champagne pastel background, an elegant small clear rectangular perfume bottle holding pale pink liquid with a champagne-gold cylindrical cap, delicate white jasmine blossoms and soft olive green leaves growing up its right side, subtle realistic shadows, refined editorial luxury product styling. Place the bottle and botanical sprig along the right third, leaving the left two-thirds pale and almost empty for live HTML copy. Match the gentle warm tonal palette and clean composition of the referenced reward card. No lettering, labels, brand text, buttons, interface, badges, people, or watermark. This is an integrated website asset, not an app mockup.
