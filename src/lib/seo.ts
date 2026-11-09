import type { Metadata } from "next";
import type { Property } from "./types";
import { imageUrl } from "./cloudinary";
import { formatKES } from "./format";

export const SITE_NAME = "PataKeja";
export const TAGLINE = "Find your place. Make your move.";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.patakeja.co.ke").replace(/\/$/, "");

export function pageMeta(title: string, description: string, path = "", opts: { image?: string; noindex?: boolean } = {}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website", locale: "en_KE", images: opts.image ? [opts.image] : undefined },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const noIndex: Metadata = { robots: { index: false, follow: false } };

export function propertyJsonLd(p: Property) {
  const cover = p.images?.[0];
  return {
    "@context": "https://schema.org",
    "@type": p.listingType === "rent" ? "Accommodation" : "RealEstateListing",
    name: p.title,
    description: p.description.slice(0, 300),
    url: `${SITE_URL}/property/${p.slug ?? p.id}`,
    image: p.images?.slice(0, 5).map((i) => imageUrl(i, { w: 1200 })),
    offers: { "@type": "Offer", price: p.price, priceCurrency: "KES", availability: p.availability === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
    address: { "@type": "PostalAddress", addressLocality: p.location.town ?? p.location.county, addressRegion: p.location.county, addressCountry: "KE" },
    numberOfRooms: p.bedrooms,
    ...(cover ? { primaryImageOfPage: imageUrl(cover, { w: 1200 }) } : {}),
  };
}

export const propertyDescription = (p: Property) =>
  `${p.categoryName} ${p.listingType === "rent" ? "for rent" : "for sale"} in ${[p.location.estate ?? p.location.town, p.location.county].filter(Boolean).join(", ")} — ${formatKES(p.price)}${p.listingType === "rent" ? " per month" : ""}.`;
