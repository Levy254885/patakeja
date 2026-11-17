# Migration from the Laravel app (docs/legacy)

The old app was a Laravel, Persian/RTL real-estate site with rahn/ejareh pricing. PataKeja is a new Kenyan product, not a port: the stack, market, language, currency and payment model changed. Existing Laravel data is not migrated (different domain: Iranian properties, Persian text, toman).

| Laravel feature | New implementation |
|---|---|
| Property listings (`resource properties`, Property model) | `properties` collection; `src/app/(site)/{rent,sale,commercial,land,property/[slug]}`; portal CRUD in `src/app/portal` |
| Sale vs rent, deposit (rahn) + monthly rent (ejareh) | `listingType` rent/sale, `price` (monthly rent or price), `depositAmount` |
| Property `status_id` lookup | `status` (draft/pending/published/rejected/archived) approval workflow + `availability` (available/under-offer/rented/sold) |
| Lookup tables (`lookup/{type}`: types, statuses, amenities) | `propertyCategories`, `amenities` collections, admin CRUD |
| Locations resource | `locations` (47 counties bundled in `src/lib/locations`, extendable by admins) |
| Inquiries + visit requests, honeypot/throttle | `inquiries`, `viewingAppointments`; owner notified by trigger; spam: App Check recommended (no honeypot port) |
| Inquiry status patch | `inquiries.status` new/contacted/closed via portal |
| Users resource, roles | `users` + custom claims; roles superAdmin/admin/agent/landlord/customer; `setUserRole` |
| Force password change | `mustChangePassword` field on the user profile |
| Profile edit/delete | `src/app/account` profile; `publicProfiles` for opt-in public agent pages |
| Dashboard | `src/app/portal`, `src/app/admin`, `src/app/account` dashboards |
| Image gallery (local storage) | Cloudinary signed uploads, `CloudImage` |
| Persian RTL UI | Replaced: English, LTR (design tokens in `tailwind.config.ts`) |
| (none) | New: M-Pesa payments, contact unlocks, boosts, verification requests, reports, support tickets, notifications, audit logs, saved properties, FAQs/help CMS |

If you do want to import old listings, write a one-off script that maps each Laravel row to the `Property` shape in `src/lib/types.ts` (including `owner`, `location`, `categoryName`, `slug`) and writes `properties/{id}/private/contact` separately; none exists.
