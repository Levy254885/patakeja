# Deployment (untested procedure)

Prerequisites: Node 20, Firebase CLI (`npm i -g firebase-tools`), a Firebase project on the Blaze plan.

## 1. Firebase
1. `firebase login`, `firebase use --add` (creates `.firebaserc`; not committed).
2. Console: enable Authentication > Email/Password; create Firestore (production mode, a region close to Kenya such as `europe-west1` or `me-central1`).
3. Add a Web app; copy its config into Vercel/`.env.local` as `NEXT_PUBLIC_FIREBASE_*`.
4. Authentication > Settings > Authorized domains: add your Vercel and production domains.
5. `firebase deploy --only firestore:rules,firestore:indexes`. Index builds take minutes; queries fail until ready.
6. Optional: Firestore TTL policy on collection group `viewDedupe`, field `expireAt`. Enable App Check (reCAPTCHA v3).

## 2. Cloudinary
Create an account, note cloud name/API key/secret. Uploads are signed by `getCloudinarySignature` into `patakeja/<kind>/<uid>`; optionally create an upload preset restricting formats and enable moderation. Never expose the API secret.

## 3. Daraja (M-Pesa)
1. developer.safaricom.co.ke: create an app with the Lipa na M-Pesa Sandbox product. Sandbox shortcode is 174379; the passkey is on the app's test credentials page.
2. For production: complete Go-Live, get a Paybill/Till and its passkey; set `MPESA_ENV=production`, `MPESA_TRANSACTION_TYPE` (`CustomerPayBillOnline` for Paybill, `CustomerBuyGoodsOnline` for Till).
3. The callback URL must be public HTTPS. Generate `MPESA_CALLBACK_TOKEN` with `openssl rand -hex 32`. The function appends `?token=...` to `MPESA_CALLBACK_URL` when calling Daraja. Safaricom does not sign callbacks, so this token plus the server-side amount and checkout-id checks are the defence (see SECURITY.md).

## 4. Functions
```
cd functions && cp .env.example .env   # fill non-secret values; never commit
firebase functions:secrets:set CLOUDINARY_API_SECRET
firebase functions:secrets:set MPESA_CONSUMER_KEY
firebase functions:secrets:set MPESA_CONSUMER_SECRET
firebase functions:secrets:set MPESA_PASSKEY
firebase functions:secrets:set MPESA_CALLBACK_TOKEN
npm install && npm run build
firebase deploy --only functions
```
First deploy: the `mpesaCallback` URL is printed (`https://<region>-<project>.cloudfunctions.net/mpesaCallback`, or a Cloud Run URL for v2). Put it in `MPESA_CALLBACK_URL` and redeploy. Allow unauthenticated invocation for `mpesaCallback` only (v2 HTTPS functions are public by default; callables authenticate in code).

## 5. Seed and first admin
```
npm --prefix scripts install
export GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json   # keep outside the repo
node scripts/seed.mjs --project <id>            # add --demo for labelled sample listings
node scripts/bootstrap-super-admin.mjs --project <id> --email you@example.com
```
Register on the site first, run the bootstrap, then sign out and in.

## 6. Vercel
Import the repo, framework Next.js, set all `NEXT_PUBLIC_*` variables (including `NEXT_PUBLIC_FUNCTIONS_REGION`), deploy. Set `ALLOWED_ORIGIN` in the functions to the production origin (comma-separated for several) and redeploy functions.

## 7. Go live
Run docs/TESTING.md on sandbox first, then switch Daraja to production with a small real amount. Remove demo listings (`isDemo == true`) before launch.
