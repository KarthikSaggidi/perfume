# Storefront and administration

Run both applications with `npm run dev`, or use a terminal for each:

```sh
npm run dev:store
npm run dev:admin
```

| Portal | Local address | Scope |
| --- | --- | --- |
| Storefront | http://localhost:3001 | Shopping, customer OTP, account, checkout |
| Admin | http://127.0.0.1:3002/admin/login | Staff login, products, campaigns, orders, CRM, settings |

Use the exact hostname as well as the port. Cookies are scoped by hostname, not port. `localhost` and `127.0.0.1` give these local applications separate browser cookie stores. Alternate hostnames return HTTP 421 rather than accepting a login on the wrong cookie host. Both listeners bind to `127.0.0.1` by default. No changes to the storefront navbar are needed.

The default Next server surface is storefront. The launch scripts explicitly select a surface using server-only `VELORA_APP_SURFACE`. Middleware rejects the other portal's pages/APIs with 404. The three API handlers repeat the surface and canonical-host checks. Session lookup refuses the other identity kind even when a cookie is manually supplied. Mutations accept only their own configured origin. The admin has anti-framing headers, no-referrer policy, noindex, and no-store responses. Existing password hashing, server-side session expiry/revocation, OTP limits, and staff roles still apply. No permissive cross-origin credentials or CORS allowlist is added.

The admin cookie is `velora_admin_portal_session`, HttpOnly and SameSite=Strict. Customer cookies stay on the storefront host. Cookies require HTTPS in production. Old combined-app admin browser cookies do not sign into the new admin host: sign in again with the existing administrator credentials. Products, uploaded images, orders, accounts, and settings still share the existing PostgreSQL database, or the private `.velora` directory during local development. No data migration or password reset is performed. Local file locking protects concurrent writes from the two processes.

Development OTP codes print in the **storefront** terminal when `VELORA_SMS_MODE=development`. Real SMS configuration and credentials are unchanged.

## Custom local addresses

Set these in the ignored `.env.local` and restart both processes:

```dotenv
VELORA_STOREFRONT_URL=http://localhost:3001
VELORA_ADMIN_URL=http://127.0.0.1:3002
```

The launcher reads the port from the URL and refuses occupied ports. Choose different hostnames, even if you change the ports. Avoid `VELORA_DEV_DIST` overrides shared by both processes; each process automatically receives its own cache directory.

## Hosted deployment

Use separate HTTPS origins and two processes/deployments sharing persistent PostgreSQL storage. For example:

```dotenv
VELORA_STOREFRONT_URL=https://shop.example.com
VELORA_ADMIN_URL=https://admin.example.com
```

Build with `npm run build`. Start the two loopback listeners behind your HTTPS reverse proxy with `PORT=3001 npm run start:store` and `PORT=3002 npm run start:admin`. Forward each hostname to its own listener, preserve the canonical Host header, and overwrite untrusted forwarded-IP headers. Each deployment needs both origin settings; the launch command sets its own surface. `npm run start` starts both listeners at 3001 and 3002 (use the independent commands to override ports). Separate ports provide routing isolation; production security still depends on HTTPS, authentication, database permissions, and host/network access controls. These processes share application code and a data adapter, so this is not OS-level or database-role isolation.

## Verification

`npm run test:backend` checks route policy, strict origins, misconfiguration, and the existing commerce rules. `npm run test:split` starts disposable storefront/admin processes with separate hosts and fixture data, then uses Chromium to verify login, cookie separation, route isolation, rejected cross-origin writes, independent logout, and the storefront link. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if using an existing Chromium installation.

The older full integration harness explicitly enables a combined **test-only** surface to cover its shared fixture. Combined mode is rejected by normal development launchers and is always rejected in production.

## Vercel production projects

The storefront project is `perfume` and its public URL is `https://perfume-gamma-ten.vercel.app`. The separate admin project is `perfume-admin`, at `https://perfume-admin-brown.vercel.app/admin/login`. Both use the same GitHub repository and `main` branch. The admin root redirects to `/admin`.

Set `VELORA_APP_SURFACE=storefront` on the storefront project and `VELORA_APP_SURFACE=admin` on the admin project. Both production projects use:

```dotenv
VELORA_STOREFRONT_URL=https://perfume-gamma-ten.vercel.app
VELORA_ADMIN_URL=https://perfume-admin-brown.vercel.app
```

Connect the same persistent PostgreSQL database to both as `DATABASE_URL`; keep its value only in Vercel's encrypted environment settings. Neither the ignored local JSON database nor `.env.local` is uploaded by Git. The production build checks the portal role, distinct HTTPS origins and PostgreSQL setting before Vercel can promote an incomplete deployment. An older duplicate project linked to this repository needs its own explicit configuration before deploying this application.

The repository uses `npm run build` and Next's default `.next` output directory on Vercel. Do not run the two-process local launcher as a Vercel build command. Local launch commands and port addresses remain unchanged. SMS stays restricted to localhost unless its provider and hosted-delivery scope are explicitly configured later.
