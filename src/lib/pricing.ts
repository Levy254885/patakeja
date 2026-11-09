import type { PriceItem, PricingSettings } from "./types";
import { DEFAULT_PRICING } from "./defaults";

/** The amount a user would be charged now for a price item (promo applies while it is valid; a disabled charge is free). */
export function effectivePrice(item: PriceItem, now = Date.now()): number {
  if (!item.enabled) return 0;
  if (item.promoAmount != null && (!item.promoEndsAt || item.promoEndsAt > now)) return item.promoAmount;
  return item.amount;
}

/** Merge a raw `siteSettings/pricing` document over the bundled defaults. */
export function mergePricing(raw: Partial<PricingSettings> | null | undefined): PricingSettings {
  return { ...DEFAULT_PRICING, ...(raw ?? {}) } as PricingSettings;
}
