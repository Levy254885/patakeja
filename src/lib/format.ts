const KES = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat("en-KE");

export const formatKES = (n?: number | null) => (n == null || Number.isNaN(n) ? "-" : KES.format(n).replace("KES", "KES ").replace(/\s+/g, " "));
export const formatNumber = (n?: number | null) => (n == null ? "-" : NUM.format(n));

/** Compact price for cards: KES 12.5M, KES 85K, KES 45,000 */
export function formatPriceShort(n: number): string {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `KES ${NUM.format(n)}`;
}

export function formatDate(ms?: number | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!ms) return "-";
  return new Intl.DateTimeFormat("en-KE", opts).format(new Date(ms));
}
export function formatDateTime(ms?: number | null) {
  return formatDate(ms, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(ms?: number | null): string {
  if (!ms) return "-";
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  const units: [number, string][] = [[31536000, "year"], [2592000, "month"], [86400, "day"], [3600, "hour"], [60, "minute"]];
  for (const [secs, label] of units) {
    if (s >= secs) {
      const v = Math.floor(s / secs);
      return `${v} ${label}${v > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** "modern-3-bedroom-apartment-kilimani-AbC123xyz" -> id is the last segment (Firestore auto-ids never contain "-"). */
export const propertySlug = (title: string, id: string) => `${slugify(title) || "property"}-${id}`;
export const idFromSlug = (slug: string) => slug.split("-").pop() || slug;

/** Normalise a Kenyan phone number to +2547XXXXXXXX. Returns null if invalid. */
export function normalizeKenyanPhone(input: string): string | null {
  const d = input.replace(/[^\d+]/g, "");
  let n = d.startsWith("+") ? d.slice(1) : d;
  if (n.startsWith("0")) n = "254" + n.slice(1);
  else if (n.startsWith("7") || n.startsWith("1")) n = "254" + n;
  return /^254(7|1)\d{8}$/.test(n) ? "+" + n : null;
}

export const whatsappLink = (phone: string, text?: string) => {
  const n = normalizeKenyanPhone(phone);
  if (!n) return null;
  return `https://wa.me/${n.slice(1)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

export const pluralize = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}
