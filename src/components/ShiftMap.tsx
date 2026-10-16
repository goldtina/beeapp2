import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  kind: "shift" | "worker" | "me";
  urgent?: boolean;
  label: string;
}

/** Browser-only map. Import via MapView (lazy) — never statically from a route. */
export default function ShiftMap({
  points,
  center,
  radiusKm,
  height = 360,
}: {
  points: MapPoint[];
  center: { lat: number; lng: number };
  radiusKm?: number | undefined;
  height?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([center.lat, center.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g || !map.current) return;
    g.clearLayers();
    if (radiusKm) {
      L.circle([center.lat, center.lng], { radius: radiusKm * 1000, className: "bee-radius" }).addTo(g);
    }
    for (const p of points) {
      if (p.kind === "worker" || p.kind === "me") {
        // Approximate area only — a soft circle, never a precise pin.
        L.circle([p.lat, p.lng], { radius: 350, className: p.kind === "me" ? "bee-area-me" : "bee-area" })
          .bindTooltip(p.label)
          .addTo(g);
      } else {
        const icon = L.divIcon({
          className: "",
          html: `<div class="bee-pin ${p.urgent ? "bee-pin-sos" : ""}"><span></span></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });
        L.marker([p.lat, p.lng], { icon }).bindPopup(p.label).addTo(g);
      }
    }
  }, [points, center.lat, center.lng, radiusKm]);

  return <div ref={el} style={{ height }} className="w-full overflow-hidden rounded-2xl border border-border" />;
}
