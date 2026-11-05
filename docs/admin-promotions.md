# Campaign popup and product offers

In **Campaigns & posters → Festival popup & offers**, choose a festival template or enter your own campaign name and reference. Edit the headline, subtitle, message, claim button text and desktop/mobile artwork. Upload images through the existing managed image uploader or use a relative image path or HTTPS URL.

**Show popup banner** controls visibility. **Enable festival offers** controls discount eligibility. These switches are independent: a visible popup with offers disabled becomes an announcement with an Explore collection link; hiding the popup preserves existing claims while the offer remains active. Optional start/end dates apply to the popup and festival offer. Choose eligible products, discount percentage and complimentary delivery here. Customer details and campaign references appear in Offer leads and its CSV export.

Use a new **Campaign reference** for each new promotion, such as `christmas-2026` or `eid-2027`. Previous claims do not unlock a new reference. Existing Diwali claims remain compatible. A stale popup submission is rejected if its campaign reference has changed.

In **Products → Edit fragrance → Offer available**, enable a sale price and enter the 50 ml offer price. An optional 100 ml offer price overrides the default, which otherwise uses the same percentage saving as 50 ml. Enabled offer prices must be positive and lower than the regular price for that size. Switching the product offer off restores regular pricing unless a claimed festival discount applies. Product offers are available without submitting the festival form.

The storefront, product pages, bag and server checkout share the same pricing helper. When both offers apply, the lower price for each size wins; discounts are not stacked. Festival delivery benefits require a valid claim and at least one eligible discounted line. Product offers and their prices are supported in product CSV import/export. Orders retain their final saved prices.

Verification: `npm run test:backend`, `npm run test:offer`, `npm run test:integration -- --browser`, and `npm run test:promotions`. All browser fixtures use temporary data and independent ports. Changes are local source changes until published.
