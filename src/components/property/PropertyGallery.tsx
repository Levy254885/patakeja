"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CloudImage } from "@/lib/types";
import { PropertyImage } from "./PropertyImage";
import { cn } from "@/lib/cn";

export function PropertyGallery({ images, title }: { images: CloudImage[]; title: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const startX = useRef<number | null>(null);
  const n = images.length;
  const go = (d: number) => n && setI((x) => (x + d + n) % n);
  const touch = { onTouchStart: (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; }, onTouchEnd: (e: React.TouchEvent) => { if (startX.current === null) return; const dx = e.changedTouches[0].clientX - startX.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); startX.current = null; } };
  return (
    <div>
      <div className="relative overflow-hidden rounded bg-ivory" {...touch}>
        <button onClick={() => n && setOpen(true)} className="block w-full" aria-label="Open photo viewer">
          <PropertyImage image={images[i]} alt={title} w={1400} sizes="(min-width:1024px) 66vw, 100vw" priority className="aspect-[3/2] w-full sm:aspect-[16/10]" />
        </button>
        {n > 1 && <>
          <button onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/90 p-2"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/90 p-2"><ChevronRight className="h-5 w-5" /></button>
          <span className="absolute bottom-2 right-2 rounded bg-charcoal/70 px-2 py-0.5 text-xs text-white">{i + 1} / {n}</span>
        </>}
      </div>
      {n > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, k) => (
            <button key={img.publicId} onClick={() => setI(k)} aria-label={`Show photo ${k + 1}`} className={cn("h-16 w-24 shrink-0 overflow-hidden rounded border-2", k === i ? "border-forest" : "border-transparent")}>
              <PropertyImage image={img} alt="" w={200} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 p-4" role="dialog" aria-modal="true" {...touch}>
          <button onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 text-white"><X className="h-6 w-6" /></button>
          {n > 1 && <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-4 text-white"><ChevronLeft className="h-8 w-8" /></button>}
          <PropertyImage image={images[i]} alt={title} w={1800} sizes="100vw" className="max-h-[85vh] max-w-full rounded object-contain" />
          {n > 1 && <button onClick={() => go(1)} aria-label="Next" className="absolute right-4 text-white"><ChevronRight className="h-8 w-8" /></button>}
        </div>
      )}
    </div>
  );
}
