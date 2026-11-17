# PataKeja — Find your place. Make your move.

Kenyan property marketplace (rent, buy, commercial, land) for all 47 counties. Next.js 14 (App Router, TypeScript, Tailwind) on **Vercel**, Firebase Auth + Firestore, Cloudinary for photos, M-Pesa (Daraja) for paid contact unlocks.

**Everything runs on Vercel.** There are no Cloud Functions and no CLI deploys: server work (Cloudinary signing, M-Pesa, roles, pricing, moderation) lives in `src/app/api/*` and reads its secrets from Vercel environment variables.

> **Status: written, not yet run.** The code type-checks against stand-in types and its pages were rendered with sample data, but it has never been executed against real Firebase, Cloudinary or M-Pesa. Expect small fixes on first run. See "Known limits".

## 1. Environment variables (add ALL of them in Vercel → Project → Settings → Environment Variables)

| Name | Secret? | Where to find it |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | no | Your live URL, no trailing slash (e.g. `https://www.patakeja.co.ke`; use the `*.vercel.app` URL until the domain is linked) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | no | Firebase console → ⚙ Project settings → General → Your apps → Web app → Config (`apiKey`) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | no | same (`authDomain`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | no | same (`projectId`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | no | same (`storageBucket`) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | no | same (`messagingSenderId`) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | no | same (`appId`) |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | no | same, optional |
| `FIREBASE_CLIENT_EMAIL` | **yes** | Firebase console → Project settings → Service accounts → Generate new private key → JSON field `client_email` |
| `FIREBASE_PRIVATE_KEY` | **yes** | same JSON, field `private_key` (paste the whole value including the BEGIN/END lines) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | no | Cloudinary dashboard → cloud name |
| `CLOUDINARY_API_KEY` | **yes** | Cloudinary → Settings → API Keys |
| `CLOUDINARY_API_SECRET` | **yes** | same page (click the eye icon) |
| `SUPER_ADMIN_EMAILS` | semi | Your own email(s), comma-separated. The first admin bootstrap (section 3) |
| `MPESA_ENV` | no | `sandbox` while testing, `production` when live |
| `MPESA_CONSUMER_KEY` | **yes** | developer.safaricom.co.ke → My Apps → your app |
| `MPESA_CONSUMER_SECRET` | **yes** | same |
| `MPESA_SHORTCODE` | no | Sandbox `174379`; live: your Paybill/Till |
| `MPESA_PASSKEY` | **yes** | Sandbox: Daraja → APIs → M-Pesa Express → Simulate; live: from Safaricom |
| `MPESA_TRANSACTION_TYPE` | no | `CustomerPayBillOnline` (Paybill) or `CustomerBuyGoodsOnline` (Till) |
| `MPESA_CALLBACK_TOKEN` | **yes** | Any long random string you make up. Safaricom calls `<SITE_URL>/api/mpesa/callback?token=<this>` |

Rules: names exactly as written; tick Production (and Preview); **redeploy after any change**; never put secrets in `NEXT_PUBLIC_*` names. The M-Pesa variables can be added later; until then the payment screen says payments are not configured.

## 2. One-time Firebase console setup (copy and paste, no CLI)
1. Authentication → Sign-in method → enable **Email/Password**. Authentication → Settings → Authorized domains → add your Vercel and live domains.
2. Firestore Database → Create database (production mode).
3. Firestore → **Rules** → paste the contents of `firestore.rules` → Publish.
4. Firestore → **Indexes** → create the composite indexes listed in `firestore.indexes.json`. Easier: use the app; when a page needs a missing index the browser console shows a one-click "create index" link.
5. (Optional) Firestore → TTL → add a policy for collection `viewDedupe`, field `expireAt`, to auto-clean view-count markers.

## 3. Become the first admin
Put your email in `SUPER_ADMIN_EMAILS`, register on the site with that email, and click the verification link Firebase emails you. Sign in again: the server promotes verified listed emails to super admin (`/api/auth/sync`). Then open `/admin`. Other admins are made from Admin → Roles & admins.

## 4. Go live
Link your domain in Vercel, set `NEXT_PUBLIC_SITE_URL` to it, redeploy. For payments: create the Daraja app, add the `MPESA_*` variables, test in sandbox (see `docs/TESTING.md`), then switch `MPESA_ENV=production`.

## What is in the box
- **Public:** home, rent/buy/commercial/land lists (pill filter bar, List/Map toggle with price pins on OpenStreetMap), search, property page (gallery, facts, map, similar, enquiry/viewing/report, M-Pesa contact unlock), county pages, agents, about/contact/help/FAQ/terms/privacy, sitemap, robots.
- **Tenant dashboard** `/account`, **landlord/agent portal** `/portal` (5-step listing wizard, Cloudinary multi-upload with cover/reorder/delete, boosts, verification, analytics), **admin** `/admin` (users, listings, approvals, verification, payments, revenue, pricing, boosts, locations, categories/amenities, reports, broadcast, CMS, tickets, roles, settings, audit log).
- Pricing (registration, contact unlock, boost) is edited by admins and enforced on the server; the browser never sends a price.
- Locations: 47 counties with subcounties/towns/estates bundled, extendable from Admin → Locations.

## Known limits
- Never executed against live services; first run may need fixes. Fully untested: M-Pesa sandbox/live flow, Cloudinary uploads, Firestore rules, API routes.
- Search filters in memory (fine to a few thousand listings; move to Algolia/Typesense after).
- Map pins without exact coordinates are shown at an approximate county position (labelled).
- No refunds, no job to recover payments whose callback never arrives (check Admin → Payments for `pending`).
- Save/unlock counters on listings are only partially maintained (views, enquiries, unlocks are; saves are not).
- Terms and privacy pages are drafts that need legal review.
- Local dev: `npm install`, copy `.env.example` to `.env.local`, `npm run dev`. `npm run typecheck` runs the real TypeScript check.
