import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

type Props = {
  floodProbabilityPct: number;
};

const CHENNAI = { lat: 13.0827, lng: 80.2707 };

// Fix default marker icons when bundling.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
});

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * PUBLIC_INTERFACE
 */
export function RiskMap({ floodProbabilityPct }: Props) {
  /** Leaflet map that visualizes risk intensity with a colored circle. */
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const style = useMemo(() => {
    const t = clamp01(floodProbabilityPct / 100);
    // interpolate blue->orange->red
    const color = t > 0.6 ? "#ef4444" : t > 0.2 ? "#f59e0b" : "#3b82f6";
    const fillOpacity = 0.15 + t * 0.25;
    const radius = 1800 + t * 4200;
    return { color, fillOpacity, radius };
  }, [floodProbabilityPct]);

  useEffect(() => {
    if (!mapEl.current) return;
    if (mapRef.current) return;

    const map = L.map(mapEl.current, {
      zoomControl: false,
      preferCanvas: true
    }).setView([CHENNAI.lat, CHENNAI.lng], 11);

    L.control
      .zoom({
        position: "bottomright"
      })
      .addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    L.marker([CHENNAI.lat, CHENNAI.lng]).addTo(map).bindPopup("Chennai");

    // Bounding box overlay (visual framing).
    const bounds = L.latLngBounds(
      [12.85, 80.05],
      [13.25, 80.45]
    );
    L.rectangle(bounds, {
      color: "#3b82f6",
      weight: 1,
      fillOpacity: 0.06
    }).addTo(map);

    const circle = L.circle([CHENNAI.lat, CHENNAI.lng], {
      radius: style.radius,
      color: style.color,
      fillColor: style.color,
      fillOpacity: style.fillOpacity,
      weight: 2
    }).addTo(map);

    circleRef.current = circle;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setStyle({
      color: style.color,
      fillColor: style.color,
      fillOpacity: style.fillOpacity
    });
    circleRef.current.setRadius(style.radius);
  }, [style]);

  return <div ref={mapEl} className="mapCanvas" role="application" aria-label="Chennai risk map" />;
}
