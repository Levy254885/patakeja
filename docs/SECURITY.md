# Security model (design intent; unaudited, untested)

## Trust boundaries
- The browser is untrusted. Prices, roles, payment flags, boosts, stats and audit logs are written only by Cloud Functions (Admin SDK) or admins, and rules deny owner edits of those fields.
- Secrets exist only as Functions secrets/env. `NEXT_PUBLIC_*` values are public identifiers.

## Firestore rules (firestore.rules)
- Roles: admin roles come from the custom claim `role` (set by `setUserRole` or the bootstrap script). Lister/customer roles are read from `users/{uid}.role`, which users cannot change after creation.
- `users`: owner/admin read; create only as customer/landlord/agent; owners cannot change role, email, uid, `registrationFeePaid`, `disabled`, `verification`.
- `properties`: public read only when `status == "published"`; owners read their own. Owners cannot change `boostedUntil`, `stats`, `verified`, `featured`, `ownerId`, `owner`. Owners can set `published` themselves only when `siteSettings/general.requireListingApproval == false`; otherwise only admins approve.
- `properties/{id}/private/contact`: readable by owner, admins, or users with `contactUnlocks/{uid}_{id}`. Write by owner/admin only.
- `payments`, `contactUnlocks`, `boostCampaigns`, `auditLogs`, `notifications` (create): no client writes. `siteSettings/pricing`: no client writes (callable only).
- Everything else is denied by default.
- Known weak spots: anonymous creation of `inquiries`, `viewingAppointments`, `reports` (shape checks only, no rate limit); `publicProfiles` is world-readable by design; rules unit tests do not exist.

## Payments
- Amount is computed server-side from `siteSettings/pricing`; the client sends only purpose, property id and phone.
- Contact access: blocked for own listings and unpublished listings; idempotent (existing unlock returns amount 0). Duplicate pending requests within 2 minutes are reused.
- Boost/registration: boost only on own published listing; registration only for landlord/agent.
- `mpesaCallback` requires POST and a constant-time-compared `token` query parameter. It looks up the payment by `CheckoutRequestID`, processes it once inside a transaction, requires paid amount >= expected, and takes the receipt number from Daraja. Unknown ids are ignored.
- Residual risk: the callback is not signed by Safaricom; a leaked token plus a valid CheckoutRequestID could forge a success. Mitigation not implemented: confirm via Daraja Transaction Status Query before fulfilling. Also optionally restrict by Safaricom source IPs at a proxy.
- Phone numbers on payments are stored in clear in `payments` (readable by owner and admins only).

## Uploads
`getCloudinarySignature` signs `timestamp`, `folder`, `allowed_formats` only for the caller's folder. `deleteCloudinaryAsset` requires the caller's own folder (or an admin). Size limits are not enforced server-side; set them in a Cloudinary upload preset.

## Operations
- Role changes (`setUserRole`) are super-admin only, cannot demote the last super admin, and are audit-logged. Revoke sessions manually if needed.
- Audit logs come from callables and auth-context triggers; `actorId` is "unknown" if the auth context is missing.
- Turn on App Check, budget alerts, and Cloud Logging alerts on `mpesaCallback` 4xx/5xx.
- Private contact data must never be copied into public documents or search indexes.
