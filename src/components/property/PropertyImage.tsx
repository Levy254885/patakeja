import { Building2 } from "lucide-react";
import { imageSrcSet, imageUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/cn";
import type { CloudImage } from "@/lib/types";

/** Real photo when one exists, otherwise a neutral photo-ready placeholder (never a fake photograph). */
export function PropertyImage({ image, alt, className, sizes = "(min-width:1024px) 33vw, 100vw", w = 800, priority }: { image?: CloudImage; alt: string; className?: string; sizes?: string; w?: number; priority?: boolean }) {
  const src = imageUrl(image, { w, h: Math.round(w * 0.66), crop: "fill" });
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-ivory text-muted", className)} role="img" aria-label={`${alt} (photo coming soon)`}>
        <div className="flex flex-col items-center gap-1.5"><Building2 className="h-7 w-7" aria-hidden /><span className="text-xs">Photos coming soon</span></div>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} srcSet={imageSrcSet(image)} sizes={sizes} alt={image?.alt || alt} loading={priority ? "eager" : "lazy"} decoding="async" className={cn("object-cover", className)} />;
}
