"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Property } from "@/lib/types";
import { pointFor, shortPrice } from "@/lib/map";
import { imageUrl } from "@/lib/cloudinary";

/** Price-pin map (OpenStreetMap tiles via Leaflet). Pins use exact coordinates when the owner set them, otherwise an approximate county position. */
export function ListingsMap({ items, activeId, onSelect, className }: { items: Property[]; activeId?: string; onSelect?: (id: string) => void; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { zoomControl: false, scrollWheelZoom: true }).setView([-1.2864, 36.8172], 7);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      draw();
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = () => {
    const L = LRef.current, map = mapRef.current, layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    const pts = items.map(pointFor).filter((x): x is NonNullable<ReturnType<typeof pointFor>> => !!x);
    for (const pt of pts) {
      const p = pt.property;
      const icon = L.divIcon({ className: "pk-pin-wrap", html: `<div class="pk-pin${p.id === activeId ? " is-active" : ""}">${shortPrice(p.price)}</div>`, iconSize: [0, 0] });
      const cover = imageUrl(p.images?.[0], { w: 320, h: 200, crop: "fill" });
      const popup = `<div class="pk-popup">${cover ? `<img src="${cover}" alt="" />` : ""}<strong>${esc(p.title)}</strong><span>${esc(p.location.town)}, ${esc(p.location.county)}${pt.approximate ? " · approximate position" : ""}</span><a href="/property/${esc(p.slug || p.id)}">View details</a></div>`;
      L.marker([pt.lat, pt.lng], { icon }).addTo(layer).bindPopup(popup).on("click", () => onSelect?.(p.id));
    }
    if (pts.length) map.fitBounds(L.latLngBounds(pts.map((x) => [x.lat, x.lng])), { padding: [40, 40], maxZoom: 13 });
  };

  useEffect(draw, [items, activeId]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={el} className={className} role="region" aria-label="Map of listings" />;
}

const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
