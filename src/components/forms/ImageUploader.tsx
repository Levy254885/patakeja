"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, Loader2 } from "lucide-react";
import { deleteCloudinaryAsset, uploadToCloudinary } from "@/lib/cloudinary";
import type { CloudImage } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { PropertyImage } from "@/components/property/PropertyImage";
import { cn } from "@/lib/cn";

interface Pending { key: string; name: string; preview: string; progress: number }

/**
 * Multi-image uploader. Files go straight from the browser to Cloudinary using a server-signed request
 * (callable `getCloudinarySignature`); only the resulting publicId/url are stored. images[0] is the cover.
 */
export function ImageUploader({ value, onChange, max = 20, kind = "property" }: { value: CloudImage[]; onChange: (v: CloudImage[]) => void; max?: number; kind?: "property" | "avatar" }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const latest = useRef(value);
  latest.current = value;

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - value.length - pending.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > list.length) toast.info(`Only ${max} photos are allowed per listing.`);
    await Promise.all(list.map(async (file) => {
      if (!file.type.startsWith("image/")) return toast.error(`${file.name} is not an image.`);
      if (file.size > 12 * 1024 * 1024) return toast.error(`${file.name} is larger than 12 MB.`);
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      setPending((p) => [...p, { key, name: file.name, preview, progress: 0 }]);
      try {
        const img = await uploadToCloudinary(file, { kind, onProgress: (pct) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress: pct } : x))) });
        onChange([...latest.current, img]);
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      } finally {
        URL.revokeObjectURL(preview);
        setPending((p) => p.filter((x) => x.key !== key));
      }
    }));
  };
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= value.length) return; const next = [...value]; [next[i], next[j]] = [next[j], next[i]]; onChange(next); };
  const makeCover = (i: number) => { const next = [...value]; next.unshift(next.splice(i, 1)[0]); onChange(next); };
  const remove = async (i: number) => {
    const img = value[i];
    onChange(value.filter((_, k) => k !== i));
    deleteCloudinaryAsset(img.publicId).catch(() => undefined); // best effort; orphan cleanup is also done server-side
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((img, i) => (
          <div key={img.publicId} className="overflow-hidden rounded border border-line bg-white">
            <div className="relative">
              <PropertyImage image={img} alt={`Photo ${i + 1}`} w={400} className="aspect-[4/3] w-full" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-forest px-1.5 py-0.5 text-[11px] font-medium text-white">Cover</span>}
            </div>
            <div className="flex items-center justify-between p-1.5">
              <div className="flex">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="rounded p-1.5 hover:bg-ivory disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move later" className="rounded p-1.5 hover:bg-ivory disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
              </div>
              <div className="flex">
                <button type="button" onClick={() => makeCover(i)} disabled={i === 0} aria-label="Set as cover" title="Set as cover" className="rounded p-1.5 hover:bg-ivory disabled:opacity-30"><Star className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(i)} aria-label="Delete photo" className="rounded p-1.5 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.key} className="overflow-hidden rounded border border-line bg-white">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="aspect-[4/3] w-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs font-medium"><Loader2 className="h-5 w-5 animate-spin text-forest" />{p.progress}%</div>
            </div>
            <div className="h-1.5 bg-ivory"><div className="h-full bg-forest transition-all" style={{ width: `${p.progress}%` }} /></div>
          </div>
        ))}
        {value.length + pending.length < max && (
          <button type="button" onClick={() => input.current?.click()} className={cn("flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded border-2 border-dashed border-line text-sm text-muted hover:border-forest hover:text-forest")}>
            <ImagePlus className="h-6 w-6" />Add photos
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <p className="mt-2 text-xs text-muted">Up to {max} photos, 12 MB each. The first photo is the cover. Use the arrows to reorder.</p>
    </div>
  );
}
