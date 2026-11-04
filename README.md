# Velora — storefront and store workspace

A responsive fragrance storefront with a protected administrator workspace, mobile SMS OTP accounts, persistent catalog and campaigns, customer CRM, and cash-on-delivery orders.

## Start locally

Requires Node.js 22+.

```sh
npm install
cp .env.example .env.local
npm run admin:create
npm run dev
```

- Storefront: `http://localhost:3001`
- Administrator sign-in: `http://127.0.0.1:3002/admin/login`
- Customer account: `http://localhost:3001/account`

`npm run dev` starts two local-only processes. Use `npm run dev:store` and `npm run dev:admin` to run them in separate terminals. OTP development codes appear in the storefront terminal. Each process has its own Next development cache. Ports are fixed; a busy port causes an error rather than silently moving the portal. The admin uses `127.0.0.1` and the store uses `localhost` because browser cookies are shared across ports on the same hostname.

The storefront rejects `/admin`, `/api/admin/*`, and `/api/auth/admin/*`. The admin rejects customer account, OTP, checkout, and storefront pages. APIs repeat these checks, restrict session identities to their own portal, and reject cross-origin mutations. Admin sessions use a separate host-only, HttpOnly, SameSite=Strict cookie. Use the exact addresses above; alternate local hostnames receive a 421 response. The admin's **View storefront** link opens the separate store origin. Existing credentials and shared store data are retained. See [separate portal setup and checks](docs/separate-portals.md).

`admin:create` asks for your email, name, and a password of 12–128 characters. An optional `--username store-owner` sets a case-insensitive sign-in username; the `--stdin` JSON also accepts `username`. Login accepts either that username or the account email. A server operator can explicitly allow an eight-character local-development password with `--allow-short-local-password`; production setup and the normal web password forms retain the 12-character minimum. Password entry is hidden and only a salted scrypt hash is stored. There is no shared/default administrator password. Create further staff accounts from **Team & access**. Reset an existing administrator with `npm run admin:create -- --reset` on the server. The `--stdin` option accepts a JSON object through a secure pipe for automation; do not put passwords in command arguments or commit credential files.

Local development saves data in the private, ignored `.velora/` directory. With `VELORA_SMS_MODE=development`, SMS codes are printed only in the private development-server terminal. They are never returned by an API or displayed in the account UI. This mode is disabled in production and on Vercel. Use real SMS credentials for public customer sign-in.

The catalog and campaigns are migrated from the existing storefront. Orders and customers start empty. Product stock starts at **zero**; enter actual inventory in Products. Enable cash on delivery, then configure delivery charges and taxes in Store settings before accepting orders.

## Real SMS on localhost

Real SMS works from the local application; a public deployment is not required. You need a Twilio account and a Verify service configured for six-digit codes, SMS delivery to your country, and sufficient account permissions/balance. See [Twilio Verify setup](https://www.twilio.com/docs/verify/api) and [geographic permissions](https://www.twilio.com/docs/verify/preventing-toll-fraud/verify-geo-permissions).

```sh
npm run sms:setup
# Restart your development server after setup:
npm run dev:store
```

The setup asks for the Account SID, Verify Service SID, your test mobile numbers with country codes, and a hidden Auth Token. It checks the service before saving credentials in the ignored `.env.local` file with private file permissions. It never sends a message during setup. Do not paste credentials into chat or put them in command arguments. The `--stdin` option accepts a JSON object through a secure pipe with `accountSid`, `authToken`, `verifyServiceSid`, and a `testNumbers` array.

Open `http://localhost:3001/account`, enter one of those mobile numbers, and request a code. The code is delivered by SMS and checked by Twilio before the customer session is created. Provider delivery permissions and billing must be enabled for that number. Administrator login continues to use its separate email/password account.

Setup sets `VELORA_SMS_MODE=twilio`, `VELORA_SMS_SCOPE=localhost`, and `OTP_TEST_NUMBERS`. Requests from public hostnames, production, or Vercel are rejected under this scope. Only the configured test numbers can request/check codes. The default permitted calling code is `+91`; change `OTP_ALLOWED_COUNTRY_CODES` if needed. Choosing `VELORA_SMS_MODE=development` explicitly uses terminal codes, even if Twilio credentials exist.

Run `npm run sms:check`, or use **Store settings → Customer SMS sign-in → Check SMS connection**, to verify credentials and six-digit configuration without sending SMS. The admin panel shows missing key names and connection state, never secret values. Changing `.env.local` requires restarting the development server before checking through the panel.

## Production configuration

Add these server-only environment variables to your hosting provider:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL, preferably your provider’s pooled URL |
| `DATABASE_SSL` | Optional `require` for providers requiring explicit TLS; use provider instructions |
| `VELORA_APP_SURFACE` | `storefront` or `admin` for a manually started Next server; the npm launch scripts set this |
| `VELORA_STOREFRONT_URL` | Complete HTTPS store origin, such as `https://shop.example.com` |
| `VELORA_ADMIN_URL` | Complete HTTPS admin origin on a different hostname, such as `https://admin.example.com` |
| `APP_URL` | Legacy application origin; it does not authorize cross-portal requests |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio account authentication token |
| `TWILIO_VERIFY_SERVICE_SID` | The Verify service SID beginning with `VA` |
| `VELORA_SMS_MODE` | `twilio` for real delivery; development mode is prohibited in production |
| `VELORA_SMS_SCOPE` | Defaults to `localhost`; explicitly use `all` only when enabling public sign-in |
| `OTP_TEST_NUMBERS` | Optional comma-separated E.164 allowlist; local setup restricts delivery to these numbers |
| `OTP_ALLOWED_COUNTRY_CODES` | Comma-separated allowed calling codes; defaults to `+91` |

Never prefix these credentials with `NEXT_PUBLIC_`, put them in source control, or expose them in admin forms. Configure the Verify service for six-digit SMS codes, enable the required geographic permissions, and configure its fraud prevention and billing controls. The store also applies phone, IP, application-wide send quotas, resend cooldowns, expiry, and attempt limits. See [Twilio Verify](https://www.twilio.com/docs/verify/api) and [Verify rate limits](https://www.twilio.com/docs/verify/api/rate-limits-and-timeouts).

PostgreSQL tables are initialized automatically on first access; the database role needs permission to create `velora_store` and `velora_media` in its schema. Run `admin:create` against the production `DATABASE_URL` to create your owner. Use the hosting provider’s database backup and recovery facilities. Product and campaign uploads are stored persistently in PostgreSQL, so uploads do not depend on the deployment filesystem.

Vercel requires `DATABASE_URL`: local disk is not used for production data there. Vercel functions have a read-only filesystem except temporary scratch space; see [Vercel runtimes](https://vercel.com/docs/functions/runtimes). For a self-hosted production server with a private persistent disk, local storage can be explicitly enabled with `VELORA_LOCAL_STORAGE=true` and `VELORA_DATA_DIR`. Serve that deployment over HTTPS; production session cookies always require a secure connection. A trusted reverse proxy must overwrite forwarded-IP headers used for abuse limiting. Never enable development SMS on a public server.

```sh
npm run build
# Start both behind your HTTPS reverse proxy (local listeners 3001 and 3002):
npm run start
# Or start one independently:
# PORT=3001 npm run start:store
# PORT=3002 npm run start:admin
```

## Administrator workspace

The green-and-gold dashboard follows the supplied reference. Sidebar and workspace scroll independently. Dashboard filters update all report panels together; each management page also has its own relevant filters and record menus. Import, Export, and Print are available in the top-right toolbar. Print includes every matching record across table pages; orders also have a separate printable summary. See [admin printing](docs/admin-printing.md). See [CSV rules and workspace controls](docs/admin-data-tools.md) for templates, safe previews, resource permissions, and the storefront account dropdown.

- **Overview:** actual order, paid order value, customer and inventory figures; 7/30/90-day reports with daily charts and period exports; recent orders; low-stock and fulfilment queues. Payment reports use the order placement date and current payment status. Empty stores show zero values.
- **Products:** create/edit products, SKU, 50 ml and optional 100 ml prices, stock, status, featured selection, descriptions, notes, badges, bottle color, and images. Search, sorting, pagination, row selection, and bulk inventory adjustment support daily work. Inventory changes detect newer stock updates and reject the entire batch on a conflict. Archiving preserves order history and removes the product from the public catalog. New products receive live product pages.
- **Campaigns & posters:** desktop/mobile image uploads, headline and supporting copy, internal destination links, ordering, active state, and timezone-aware schedules. Changes update the public hero.
- **Orders:** search/filter, order details, permitted fulfilment transitions, payment records, shipping carrier and tracking, internal notes, and exports. Payment records are manual bookkeeping, not a gateway charge or automatic refund.
- **Customers:** search, contact information, actual order history, tags, internal notes, blocking/unblocking, and export. Staff notes are not returned to customer accounts.
- **Store settings:** identity, contact information, announcement, shipping, free-delivery threshold, tax rate, COD availability, stock alerts, order prefix, maintenance/order pause, customer registration, and integration readiness. SMS setup guidance and a read-only provider check help connect local delivery. Unsaved changes are protected when navigating, refreshing, or leaving the page.
- **Team & access:** owner/manager/support roles and activation. Owners manage staff; managers manage catalog, campaigns, orders, customers, and store settings; support staff manage orders and customers. Owners cannot disable or demote their own account or remove the last active owner.
- **Activity and security:** audit trail, password changes, revocable secure sessions. Password changes revoke earlier administrator sessions.

The workspace search (Cmd/Ctrl K) finds permitted products, orders, customers, campaigns, and settings. Selecting a result opens its record directly; record links can be bookmarked. Overview shortcuts open the relevant queue or editor. Reports refresh periodically without interrupting open dialogs or settings edits. Tables and dialogs adapt to mobile screens.

Uploads accept JPEG, PNG, and WebP up to 2,000,000 bytes, validate actual file content, and re-encode the image as WebP. SVG and arbitrary files are rejected. HTTPS image URLs are also supported. CSV exports escape spreadsheet formula prefixes.

## Login pages

The customer account entry and administrator sign-in use the supplied fragrance reference designs: a shared photographic backdrop, centered cards, a Velora wordmark, and dark green controls. Both layouts adapt to narrow screens, short viewports, and text zoom. Signed-in customers keep the account dashboard and storefront navigation.

Administrator sign-in includes password visibility and a **Remember me** option. Unchecked, the cookie lasts for the browser session; checked, it persists for up to eight hours. The server enforces the same eight-hour expiry in either case. **Forgot password?** explains recovery through the server administrator and the existing private `admin:create -- --reset` command; email-based password recovery is not connected.

Customer sign-in supports an inline country selector, custom calling codes, six-digit paste/autofill and keyboard navigation, resend cooldowns, countdown-based expiry, and change-number controls. Verification errors remain visible and are announced to assistive technology. A successful sign-in preserves the existing wishlist migration and validated checkout return link. Real delivery still depends on the configured SMS provider; development mode uses terminal codes.

Background provenance and the image-generation prompt are in [docs/login-design.md](docs/login-design.md).

## Customer experience and orders

The account icon opens the dedicated account page. Sign-in verifies a mobile number using a six-digit code from Twilio Verify. Accounts provide profile and marketing-preference editing, saved addresses/default address, a persistent wishlist, actual order history, shipment links, and cancellation of pending or confirmed orders. Guest favourites are merged at sign-in; sign-out clears the device’s account wishlist copy.

Checkout requires customer sign-in and an India delivery address. The server validates active products and stock, calculates prices, shipping and tax from current store settings, and checks the reviewed total. Order creation is idempotent and updates stock within the same transaction. Cancelling an eligible order restores stock exactly once. Admin product/price changes never rewrite historical order lines.

Only cash on delivery is implemented. No online card/UPI payment gateway, carrier booking, marketing campaign delivery, or automatic refunds are connected. Product review previews remain browser-local and are labelled accordingly. Publish the operator’s real contact details, delivery/returns policy, ingredient declarations, and data retention policy before accepting live orders.

## Storage and access

PostgreSQL stores the application state in a versioned JSONB document with a row lock for mutations; image bytes have a separate table. This keeps mutations atomic across application instances. Local development uses a private lock, atomic file replacement, and restrictive permissions. This adapter suits a single-store workload; larger catalogs and high-volume reporting should split entities into indexed relational tables rather than increase the shared document indefinitely.

Every admin API request checks the current administrator and role. Every customer request checks the session and record ownership. Administrator and customer sessions use separate opaque, hashed tokens and HttpOnly cookies. Browser mutations validate their origin. Credentials, OTPs, private CRM notes, and password hashes are excluded from public/customer responses. The server is authoritative for price, inventory, roles, payment records, and order ownership.

## Verification

```sh
npm run typecheck
npm run test:backend
npm run test:integration
npm run build
```

The integration runner copies the application source into a temporary fixture, creates an isolated temporary database and administrator, starts a dedicated development server, uses development-only SMS codes, and cleans up its processes/data. It never sends a real SMS. It checks auth/role boundaries, OTP throttling and reuse, catalog/poster/media changes, customer isolation, order pricing/idempotency/cancellation, CSV escaping, and session revocation. It restarts the isolated application and verifies that administrator/customer sessions, rotated passwords, revoked access, products/stock, campaigns, orders, and uploaded media persist.

Browser verification also checks every admin section at 320 px, global record search, dated reports, bulk inventory editing, guest wishlist migration, session expiry, mixed-size inventory limits, cart persistence and tab synchronization, a complete customer checkout/cancellation, and storefront/editorial layouts at 1440, 390, and 320 px. Backend tests mock Twilio service checks, SMS sends, and code verification; no test delivers a real SMS.

Browser verification is optional:

```sh
npx playwright install chromium
npm run test:integration -- --browser
```

An existing browser executable can be selected using `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. `VELORA_TEST_PORT` changes the integration server’s default port, 3215. Integration build output and generated TypeScript files stay inside the temporary fixture, so tests do not modify or invalidate the running localhost application.
