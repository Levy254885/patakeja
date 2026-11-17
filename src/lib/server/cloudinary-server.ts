import { createHash } from "node:crypto";
import { ApiError } from "./api";

export const KINDS = ["property", "avatar", "document"] as const;
export type Kind = (typeof KINDS)[number];

export function cloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, apiKey = process.env.CLOUDINARY_API_KEY, apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new ApiError(500, "Cloudinary is not configured on the server (set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel).");
  return { cloudName, apiKey, apiSecret };
}
export const sign = (params: Record<string, string | number>, secret: string) =>
  createHash("sha1").update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + secret).digest("hex");
