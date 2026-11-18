import type { CloudImage } from "./types";

export const cloudName = () => process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

export interface ImageOpts {
  w?: number;
  h?: number;
  crop?: "fill" | "limit" | "fit" | "scale";
  quality?: "auto" | number;
}

/** Insert Cloudinary transformations (auto format + quality + size) into a delivery URL. Non-Cloudinary URLs pass through. */
export function imageUrl(img: Pick<CloudImage, "url"> | string | undefined | null, o: ImageOpts = {}): string | null {
  const url = typeof img === "string" ? img : img?.url;
  if (!url) return null;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const t = ["f_auto", `q_${o.quality ?? "auto"}`];
  if (o.w) t.push(`w_${o.w}`);
  if (o.h) t.push(`h_${o.h}`);
  t.push(`c_${o.crop ?? (o.h ? "fill" : "limit")}`);
  if (o.crop === "fill" || o.h) t.push("g_auto");
  return url.replace("/upload/", `/upload/${t.join(",")}/`);
}

/** `srcset` string for responsive images, e.g. widths [400, 800, 1200]. */
export function imageSrcSet(img: Pick<CloudImage, "url"> | undefined | null, widths: number[] = [400, 800, 1200, 1600]): string | undefined {
  if (!img?.url || !img.url.includes("res.cloudinary.com")) return undefined;
  return widths.map((w) => `${imageUrl(img, { w })} ${w}w`).join(", ");
}

// ---------- Signed uploads (signature comes from the `getCloudinarySignature` Cloud Function) ----------

export interface SignatureResponse {
  cloudName: string;
  apiKey: string;
  signature: string;
  /** Exact parameters that were signed; they must be sent unchanged with the upload. */
  params: Record<string, string | number>;
}

export type UploadKind = "property" | "avatar" | "document";

export interface UploadOptions {
  kind: UploadKind;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/** Downscale very large photos in the browser so uploads are fast on mobile data. */
async function downscale(file: File, max = 2400): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 2_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.86));
  } catch {
    return file;
  }
}

/**
 * Upload one file to Cloudinary using a server-signed request. The API secret never reaches the browser.
 * Returns the metadata to store in Firestore (url, publicId, size...).
 */
export async function uploadToCloudinary(file: File, opts: UploadOptions): Promise<CloudImage> {
  const { callFunction } = await import("./firebase/client");
  const sig = await callFunction<{ kind: UploadKind }, SignatureResponse>("getCloudinarySignature", { kind: opts.kind });
  const body = await downscale(file);
  const form = new FormData();
  form.append("file", body, file.name);
  form.append("api_key", sig.apiKey);
  form.append("signature", sig.signature);
  for (const [k, v] of Object.entries(sig.params)) form.append(k, String(v));

  const resource = opts.kind === "document" && !file.type.startsWith("image/") ? "raw" : "image";
  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resource}/upload`;

  return new Promise<CloudImage>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) {
          resolve({ url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height, format: res.format, bytes: res.bytes });
        } else reject(new Error(res?.error?.message || "Upload rejected by Cloudinary."));
      } catch {
        reject(new Error("Unexpected response from Cloudinary."));
      }
    };
    opts.signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(form);
  });
}

/** Ask the server to delete an asset (verifies the caller owns it). Safe to ignore failures: the reference is removed from Firestore regardless. */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  const { callFunction } = await import("./firebase/client");
  await callFunction<{ publicId: string }, { ok: boolean }>("deleteCloudinaryAsset", { publicId });
}
