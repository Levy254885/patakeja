# PataKeja

*Find your place. Make your move.* A Kenyan property marketplace (rent, sale, commercial, land) built with Next.js 14 (App Router), TypeScript, Tailwind, Firebase (Auth, Firestore, Cloud Functions) and Cloudinary. Payments by M-Pesa (Daraja STK push). It replaces the earlier Laravel "Real Estate App" (see `docs/MIGRATION.md`).

## Status: written, NOT tested

Nothing in this repository has been built, deployed or executed. npm was unavailable while it was written. Only a TypeScript type-check of the web app against stubs and `node --check` on the `.mjs` scripts were possible. Expect compile errors, wrong assumptions about library versions, and rule bugs on first run.

| Area | Written | Run / tested |
|---|---|---|
| Web app (public, account, portal, admin) | Yes | Type-checked against stubs only |
| Firestore rules | Yes | No (not run in the emulator) |
| Firestore indexes | Yes | No |
| Cloud Functions (callables, M-Pesa, triggers) | Yes | Never compiled or deployed |
| Daraja STK push + callback | Yes | Never run, not even against sandbox |
| Cloudinary signed upload/delete | Yes | No |
| `scripts/seed.mjs`, `bootstrap-super-admin.mjs` | Yes | Syntax-checked only |
| Automated tests | None | n/a |

Work through `docs/TESTING.md` before trusting any of it with real money.

## Layout

- `src/` web app. `src/lib/types.ts` is the data model.
- `functions/` Cloud Functions (TypeScript, firebase-functions v2).
- `firestore.rules`, `firestore.indexes.json`, `firebase.json`.
- `scripts/` seed and super-admin bootstrap (Admin SDK).
- `docs/` DEPLOYMENT, SECURITY, MIGRATION, TESTING (plus `AGENT_BRIEF.md`, `legacy/`).

## Environment variables

Web app (`.env.local`, see `.env.example`): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_FUNCTIONS_REGION`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_USE_EMULATORS`, optional `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`. These are public identifiers.

Functions (`functions/.env.example`): `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `MPESA_ENV`, `MPESA_CONSUMER_KEY/SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_TRANSACTION_TYPE`, `MPESA_CALLBACK_URL`, `MPESA_CALLBACK_TOKEN`, `ALLOWED_ORIGIN`, `FUNCTIONS_REGION`. Secrets bound to functions: `CLOUDINARY_API_SECRET`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_CALLBACK_TOKEN` (set with `firebase functions:secrets:set`). Never commit real values.

## Setup (short version; details in docs/DEPLOYMENT.md)

1. Create a Firebase project (Blaze plan, required for Functions and outbound calls). Enable Email/Password auth and Firestore.
2. Create a Cloudinary account; note cloud name, API key and secret.
3. Register a Daraja app (sandbox first); get consumer key/secret, shortcode and passkey.
4. `npm install`, `npm --prefix functions install`, `npm --prefix scripts install`.
5. `firebase deploy --only firestore:rules,firestore:indexes`, set secrets, `npm run functions:deploy`, then set `MPESA_CALLBACK_URL` to the deployed `mpesaCallback` URL and redeploy.
6. `node scripts/seed.mjs --project <id> [--demo]`; register on the site, then `node scripts/bootstrap-super-admin.mjs --project <id> --email <you>`.
7. Deploy the web app to Vercel with the `NEXT_PUBLIC_*` variables.

## Backend contract (callable functions)

`getCloudinarySignature({kind})`, `deleteCloudinaryAsset({publicId})`, `initiateMpesaPayment({purpose, propertyId?, phone})`, `trackPropertyView({propertyId})`, `setUserRole({uid, role})` (super admin), `updatePricing(PricingSettings)` (admin, audit-logged), `broadcastNotification({title, body, audience})` (admin). HTTPS: `mpesaCallback?token=...`. Triggers: notifications, stats counters, audit logs, listing counts, hourly boost expiry.

## Known limitations

- **Search runs in memory.** Public search fetches published listings and filters/sorts/paginates in the app (Firestore cannot do free-text, multi-range queries). That is fine for hundreds to low thousands of listings; beyond that move to Algolia, Typesense or Elastic.
- Firestore rules cannot rate-limit; enquiry/report creation is open to anonymous users (validated by shape only). Enable App Check.
- Payments: no refunds flow, no reconciliation job for callbacks that never arrive (the payment stays `pending`), no Daraja transaction-status query. Amount underpayments are flagged `needsReview`, not auto-refunded.
- Role claims: a changed role needs a token refresh (sign out/in). Non-admin roles are also read from the user document.
- `viewDedupe` documents should get a Firestore TTL policy on `expireAt`.
- Single language (English), single currency (KES).
