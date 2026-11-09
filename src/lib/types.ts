/**
 * Shared data model. This file is the single source of truth for Firestore document shapes.
 * Timestamps are normalised to epoch milliseconds (number) when read by the app (see lib/firebase/convert.ts).
 */

export type Role = "superAdmin" | "admin" | "agent" | "landlord" | "customer";
export const ADMIN_ROLES: Role[] = ["superAdmin", "admin"];
export const LISTER_ROLES: Role[] = ["landlord", "agent"];

export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

export interface CloudImage {
  url: string; // secure Cloudinary delivery URL (original)
  publicId: string; // Cloudinary public id, used for deletion and transformations
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  alt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  fullName: string;
  phone: string; // main phone
  altPhone?: string;
  photo?: CloudImage | null;
  // Customer fields
  occupation?: "student" | "employed" | "self-employed" | "other";
  institution?: string; // school or workplace; only used for optional location suggestions
  shareInstitution?: boolean; // privacy control for the above
  householdSize?: number;
  preferredCountyId?: string;
  preferredArea?: string;
  // Landlord / agent fields
  companyName?: string;
  bio?: string;
  agencyLicense?: string;
  verification?: VerificationStatus;
  registrationFeePaid?: boolean; // set only by Cloud Functions
  // Account state
  disabled?: boolean;
  mustChangePassword?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/** publicProfiles/{uid}: opt-in public page for landlords and agents (the agent directory reads this). */
export interface PublicProfile {
  id: string; // = user uid
  name: string;
  role: Role; // "agent" | "landlord"
  companyName?: string;
  bio?: string;
  photo?: CloudImage | null;
  countyIds?: string[]; // counties they operate in
  verified?: boolean; // set by admins only
  listingCount?: number; // maintained by Cloud Functions
  createdAt?: number;
}

/** Subset of a lister profile that is safe to show publicly (stored on the property as denormalised data). */
export interface PublicLister {
  id: string;
  name: string;
  role: Role;
  companyName?: string;
  photoUrl?: string;
  verified?: boolean;
}

export type ListingType = "rent" | "sale";
export type CategoryGroup = "residential" | "commercial" | "land";
export type Furnishing = "unfurnished" | "semi-furnished" | "furnished";

/** Approval workflow state. Only "published" listings are public. */
export type PublishStatus = "draft" | "pending" | "published" | "rejected" | "archived";
/** Market availability (the Laravel app's property statuses). */
export type Availability = "available" | "under-offer" | "rented" | "sold";

export interface PropertyLocation {
  countyId: string; // e.g. "047" (Nairobi)
  county: string;
  subcounty?: string;
  ward?: string;
  town: string;
  estate?: string;
  address?: string; // optional street/landmark text (public)
  lat?: number;
  lng?: number;
}

export interface PropertyStats {
  views: number;
  enquiries: number;
  unlocks: number;
  saves: number;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  listingType: ListingType;
  categoryId: string; // propertyCategories doc id
  categoryName: string; // denormalised for display and search
  categoryGroup: CategoryGroup;
  price: number; // KES: monthly rent for "rent", selling price for "sale"
  depositAmount?: number; // KES, rentals only
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number; // built-up area
  landSizeAcres?: number;
  furnishing?: Furnishing;
  amenities: string[]; // amenity doc ids
  amenityNames?: string[]; // denormalised for display
  location: PropertyLocation;
  images: CloudImage[]; // images[0] is the cover photograph
  ownerId: string;
  owner: PublicLister;
  status: PublishStatus;
  availability: Availability;
  rejectionReason?: string;
  verified?: boolean; // admin-verified listing
  featured?: boolean; // admin-curated
  boostedUntil?: number; // set only by Cloud Functions
  isDemo?: boolean; // sample content, clearly labelled in the UI
  stats?: PropertyStats; // maintained by Cloud Functions
  createdAt?: number;
  updatedAt?: number;
  publishedAt?: number;
}

/** properties/{id}/private/contact: readable only by owner, admins, or users who unlocked it. */
export interface PropertyContact {
  contactName: string;
  phone: string;
  whatsapp?: string;
  altPhone?: string;
  email?: string;
}

export interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
  group: CategoryGroup;
  order: number;
  active: boolean;
}

export type AmenityGroup = "security" | "utilities" | "comfort" | "building" | "outdoor" | "land";
export interface Amenity {
  id: string;
  name: string;
  group: AmenityGroup;
  active: boolean;
}

export type LocationLevel = "county" | "subcounty" | "ward" | "town" | "estate";
export interface LocationNode {
  id: string;
  name: string;
  level: LocationLevel;
  parentId?: string; // id of the parent node (counties have none)
  countyId: string; // id of the owning county node
  slug: string;
  active?: boolean;
}

export type InquiryStatus = "new" | "contacted" | "closed";
export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  customerId?: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: InquiryStatus;
  createdAt?: number;
}

export type AppointmentStatus = "pending" | "confirmed" | "declined" | "completed" | "cancelled";
export interface ViewingAppointment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  customerId?: string;
  name: string;
  phone: string;
  email?: string;
  preferredDate: string; // ISO date yyyy-mm-dd
  preferredTime: string; // HH:mm
  message?: string;
  status: AppointmentStatus;
  createdAt?: number;
}

export interface SavedProperty {
  id: string; // `${userId}_${propertyId}`
  userId: string;
  propertyId: string;
  createdAt?: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: "inquiry" | "viewing" | "payment" | "listing" | "system" | "verification";
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt?: number;
}

export type PaymentPurpose = "contact-access" | "landlord-registration" | "boost";
export type PaymentStatus = "pending" | "success" | "failed" | "cancelled";
/** payments/{checkoutRequestId}: server-written ledger. Serves as the transaction record and receipt. */
export interface Payment {
  id: string;
  userId: string;
  purpose: PaymentPurpose;
  propertyId?: string;
  propertyTitle?: string;
  amount: number; // KES, decided server-side from siteSettings/pricing
  phone: string;
  status: PaymentStatus;
  mpesaReceipt?: string;
  resultDesc?: string;
  createdAt?: number;
  completedAt?: number;
}

export interface ContactUnlock {
  id: string; // `${userId}_${propertyId}`
  userId: string;
  propertyId: string;
  paymentId: string;
  createdAt?: number;
}

export interface BoostCampaign {
  id: string;
  propertyId: string;
  ownerId: string;
  paymentId: string;
  startsAt?: number;
  endsAt: number;
  amount: number;
  createdAt?: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  kind: "landlord" | "agent" | "property";
  propertyId?: string;
  note?: string;
  documents: CloudImage[]; // supporting documents stored in Cloudinary
  status: "pending" | "approved" | "rejected";
  reviewNote?: string;
  reviewedBy?: string;
  createdAt?: number;
}

export interface ListingReport {
  id: string;
  propertyId: string;
  propertyTitle: string;
  reporterId?: string;
  reason: "scam" | "wrong-info" | "unavailable" | "duplicate" | "other";
  details?: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  createdAt?: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: "account" | "payment" | "listing" | "other";
  status: "open" | "pending" | "closed";
  replies?: { by: "user" | "staff"; name: string; message: string; at: number }[];
  createdAt?: number;
  updatedAt?: number;
}

export interface PriceItem {
  amount: number; // KES
  enabled: boolean;
  promoAmount?: number; // optional promotional price
  promoEndsAt?: number;
}
export interface PricingSettings {
  landlordRegistration: PriceItem;
  contactAccess: PriceItem;
  boost: PriceItem & { durationHours: number };
  updatedAt?: number;
  updatedBy?: string;
}

export interface GeneralSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  requireListingApproval: boolean;
  maintenanceMode?: boolean;
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  body: string;
  published: boolean;
  order: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  audience: "all" | "tenants" | "landlords";
  order: number;
  published: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string; // e.g. "pricing.update", "property.approve", "user.role"
  targetType: string;
  targetId?: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  createdAt?: number;
}

/** Filters accepted by the property search (URL search params map 1:1 onto this). */
export interface SearchFilters {
  listingType?: ListingType;
  group?: CategoryGroup;
  category?: string; // category slug
  county?: string; // county id
  subcounty?: string;
  town?: string;
  q?: string; // free text: estate, town, title
  minPrice?: number;
  maxPrice?: number;
  beds?: number; // minimum bedrooms
  baths?: number;
  furnishing?: Furnishing;
  amenities?: string[];
  availability?: Availability;
  verified?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "relevance";
  page?: number;
}
