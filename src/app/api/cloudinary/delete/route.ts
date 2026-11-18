import { ApiError, body, isAdmin, ok, requireUser, run } from "@/lib/server/api";
import { KINDS, cloudinaryConfig, sign, type Kind } from "@/lib/server/cloudinary-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return run(async () => {
    const user = await requireUser(req);
    const publicId = String((await body<{ publicId: string }>(req)).publicId ?? "");
    if (!publicId.startsWith("patakeja/") || publicId.includes("..")) throw new ApiError(400, "Invalid asset id.");
    const [, kind, owner] = publicId.split("/");
    if (!KINDS.includes(kind as Kind)) throw new ApiError(400, "Invalid asset id.");
    if (owner !== user.uid && !isAdmin(user)) throw new ApiError(403, "You can only delete your own files.");
    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
    let deleted = false;
    for (const type of kind === "document" ? ["image", "raw"] : ["image"]) {
      const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
      const form = new URLSearchParams({ public_id: publicId, timestamp: String(params.timestamp), api_key: apiKey, signature: sign(params, apiSecret) });
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/destroy`, { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { result?: string };
      if (json.result === "ok") { deleted = true; break; }
    }
    return ok({ ok: deleted });
  });
}
