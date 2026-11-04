# Admin printing

The **Print** control sits beside Import and Export on Dashboard, Products, Inventory, Orders, Customers, Offer leads, Campaigns & posters, Reports & analytics, Store settings, Team & access, and Activity. It opens a dedicated authenticated print preview and the browser's print dialog. Choose a physical printer or **Save as PDF**. A print button remains available in the preview if the automatic dialog is cancelled or blocked by browser preferences.

Record reports include every matching record across all table pages. They use the same server-side filter and permission rules as CSV export: search, status, category, date range, payment, region, team role, campaign schedule, and settings group where applicable. Search fields match the respective admin table. Password hashes and provider credentials are excluded. The preview reads saved server data, so unsaved form edits are not printed.

Dashboard/report previews contain the applied period, paid order value, order/customer/product counts, stock attention, a sales chart and daily values, fulfilment summary, top products, and matching orders. Dates and printed timestamps use Asia/Kolkata. Report order values follow the existing placement-date and current-payment-status reporting model.

Order rows have **Print order** in their action menu. The order editor also has a **Print order** link. This opens a portrait order summary containing saved customer and delivery details, items/SKUs/sizes, quantities, unit prices, offer savings where present, delivery, tax, total, payment status, and shipment references. Internal staff notes and editing controls are omitted. This summary is not labelled a tax invoice.

Reports use A4 landscape and order summaries use A4 portrait. Print styles remove controls and navigation, repeat table headings, wrap long fields, and permit pagination without fixed-height containers. The storefront is not changed by the admin print routes. The separate-server policy continues to block these URLs on the storefront port, and unauthenticated visitors return to admin sign-in. Support staff can only print the resources their role can read; Team & access remains owner-only.

Verification covers the browser print button, matching records beyond the UI's ten-row pagination, filtered output, order totals and private-note exclusion, mobile controls, and role isolation. Chromium-generated PDFs are inspected for final rows, hidden controls, and page orientation.

The homepage also includes a compact **Why choose Velora** section with three existing image crops and links to notes, the fragrance collection, and customer accounts. It introduces no new shipping, packaging, ingredient-certification, or longevity claims.
