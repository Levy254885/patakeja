import { createHash } from "node:crypto";
import { onCall } from "firebase-functions/v2/https";
import { CORS, HttpsError, REGION, isAdminReq, requireAuth } from "./common";

const SECRETS = ["CLOUDINARY_API_SECRET"];
const cfg = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME, apiKey = process.env.CLOUDINARY_API_KEY, apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new HttpsError("failed-precondition", "Cloudinary is not configured on the server.");
  return { cloudName, apiKey, apiSecret };
};
const sign = (params: Record<string, string | number>, secret: string) =>
  createHash("sha1").update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + secret).digest("hex");

const KINDS = ["property", "avatar", "document"] as const;
type Kind = (typeof KINDS)[number];

export const getCloudinarySignature = onCall({ region: REGION, cors: CORS, secrets: SECRETS }, async (req) => {
  const uid = requireAuth(req);
  const kind = req.data?.kind as Kind;
  if (!KINDS.includes(kind)) throw new HttpsError("invalid-argument", "Unknown upload kind.");
  const { cloudName, apiKey, apiSecret } = cfg();
  const params: Record<string, string | number> = {
    timestamp: Math.floor(Date.now() / 1000),
    folder: `patakeja/${kind}/${uid}`,
    allowed_formats: kind === "document" ? "jpg,jpeg,png,pdf" : "jpg,jpeg,png,webp,heic",
  };
  return { cloudName, apiKey, signature: sign(params, apiSecret), params };
});

export const deleteCloudinaryAsset = onCall({ region: REGION, cors: CORS, secrets: SECRETS }, async (req) => {
  const uid = requireAuth(req);
  const publicId = String(req.data?.publicId ?? "");
  if (!publicId.startsWith("patakeja/") || publicId.includes("..")) throw new HttpsError("invalid-argument", "Invalid asset id.");
  const [, kind, owner] = publicId.split("/");
  if (!KINDS.includes(kind as Kind)) throw new HttpsError("invalid-argument", "Invalid asset id.");
  if (owner !== uid && !isAdminReq(req)) throw new HttpsError("permission-denied", "You can only delete your own files.");
  const { cloudName, apiKey, apiSecret } = cfg();
  const types = kind === "document" ? ["image", "raw"] : ["image"];
  let ok = false;
  for (const type of types) {
    const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
    const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: apiKey, signature: sign(params, apiSecret) });
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/destroy`, { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { result?: string };
    if (json.result === "ok") { ok = true; break; }
  }
  return { ok };
});
