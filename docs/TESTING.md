# Manual test checklist (nothing here has been run)

Use the emulators (`firebase emulators:start`, `NEXT_PUBLIC_USE_EMULATORS=true`) for rules and triggers; use Daraja sandbox for payments (the STK push needs the public callback URL, so test payments against a deployed dev project).

## Build
- [ ] `npm install && npm run typecheck && npm run build` pass
- [ ] `npm --prefix functions install && npm --prefix functions run build` pass (expect fixes)
- [ ] `node scripts/seed.mjs --project dev --demo` runs against the emulator; collections appear

## Rules (emulator or rules unit tests)
- [ ] Anonymous: can read published properties, categories, amenities, locations, settings, FAQs; cannot read drafts, users, payments
- [ ] Anonymous cannot read `properties/{id}/private/contact`
- [ ] Customer without unlock: contact read denied; with `contactUnlocks/{uid}_{id}`: allowed
- [ ] Owner can read own contact; other landlord cannot
- [ ] Owner cannot set `boostedUntil`, `featured`, `verified`, `stats`, `ownerId`
- [ ] With `requireListingApproval=true`, owner cannot set status `published`; admin can
- [ ] User cannot change own `role`, `registrationFeePaid`, `disabled`
- [ ] No client can write `payments`, `contactUnlocks`, `boostCampaigns`, `auditLogs`, `siteSettings/pricing`
- [ ] Notifications: user can mark own read, not others'

## Auth and roles
- [ ] Register as customer, landlord, agent; `users` and (for listers) `publicProfiles` docs created
- [ ] Bootstrap super admin; sign out/in; `/admin` accessible; non-admin redirected
- [ ] `setUserRole` by super admin works; by admin denied; last super admin cannot be demoted; audit log row exists

## Listings
- [ ] Landlord pays registration (sandbox) before listing; `registrationFeePaid` flips true
- [ ] Create draft, upload images (Cloudinary), submit; status pending; admin approves; owner notified; audit log with actor
- [ ] Reject with reason shows to owner; delete listing removes images
- [ ] Search/filters on seeded data; empty states; demo badge on `isDemo`

## Payments (sandbox)
- [ ] Contact access: STK push amount equals pricing doc (change pricing and re-test); success unlocks contact and writes receipt number; notification created
- [ ] Repeat request for an unlocked property returns amount 0 without STK push
- [ ] Double-tap within 2 minutes reuses the pending payment
- [ ] Customer cancels on phone: payment `cancelled`; no unlock
- [ ] Replay the same callback twice: second is a no-op
- [ ] Callback with wrong/missing token: 403; wrong amount: payment `failed`, `needsReview`
- [ ] Boost: `boostedUntil` and `boostCampaigns` set; second boost extends; `expireBoosts` clears after expiry
- [ ] Pricing set to disabled or promo 0: immediate unlock, ledger row amount 0

## Triggers and callables
- [ ] Inquiry creates owner notification and increments `stats.enquiries`; viewing request notifies owner; status change notifies customer
- [ ] Save/unsave changes `stats.saves`; unlock changes `stats.unlocks`
- [ ] `trackPropertyView` increments once per visitor per day; not for owner
- [ ] `updatePricing` validates (negative, promo > price rejected) and writes before/after audit
- [ ] `broadcastNotification` to each audience; counts match
- [ ] `getCloudinarySignature` unauthenticated: rejected; `deleteCloudinaryAsset` for another user's id: rejected

## Frontend smoke
- [ ] Every route has loading, empty and error states; 360px width; keyboard focus; no horizontal scroll
