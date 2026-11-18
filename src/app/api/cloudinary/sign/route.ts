import { ApiError, body, ok, requireUser, run } from "@/lib/server/api";
import { KINDS, cloudinaryConfig, sign, type Kind } from "@/lib/server/cloudinary-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns a short-lived signature so the browser can upload straight to Cloudinary. The API secret never leaves the server. */
export async function POST(req: Request) {
  return run(async () => {
    const user = await requireUser(req);
    const { kind } = await body<{ kind: Kind }>(req);
    if (!KINDS.includes(kind)) throw new ApiError(400, "Unknown upload kind.");
    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
    const params: Record<string, string | number> = {
      timestamp: Math.floor(Date.now() / 1000),
      folder: `patakeja/${kind}/${user.uid}`,
      allowed_formats: kind === "document" ? "jpg,jpeg,png,pdf" : "jpg,jpeg,png,webp,heic",
    };
    return ok({ cloudName, apiKey, signature: sign(params, apiSecret), params });
  });
}
