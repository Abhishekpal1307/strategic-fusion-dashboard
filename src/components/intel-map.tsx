import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.heat";
import type { IntelNode, RiskLevel, SourceType } from "@/lib/intel-types";
import { RISK_LABEL, SOURCE_LABEL } from "@/lib/intel-types";

const RISK_HEX: Record<RiskLevel, string> = {
  high: "#e25555",
  medium: "#e8b048",
  low: "#5ec27e",
  verified: "#4aa6ff",
};

const TILES = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr: "© OpenStreetMap © CARTO",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "© Esri World Imagery",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr: "© OpenTopoMap",
  },
} as const;

type Style = keyof typeof TILES;

function makeIcon(risk: RiskLevel) {
  const color = RISK_HEX[risk];
  const pulse = risk === "high" ? "animation: pulseDot 1.6s infinite;" : "";
  const html = `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};box-shadow:0 0 0 2px rgba(255,255,255,0.25),0 0 12px ${color};${pulse}"></span>`;
  return L.divIcon({ html, className: "fusion-marker", iconSize: [14, 14], iconAnchor: [7, 7] });
}

interface Props {
  nodes: IntelNode[];
  filterRisks: RiskLevel[];
  filterSources: SourceType[];
  showHeatmap: boolean;
  showClusters: boolean;
  style: Style;
  onSelect: (n: IntelNode) => void;
}

export function IntelMap({
  nodes,
  filterRisks,
  filterSources,
  showHeatmap,
  showClusters,
  style,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<L.Layer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [23.5, 80],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;
    setReady(true);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const t = TILES[style];
    tileRef.current = L.tileLayer(t.url, { attribution: t.attr, maxZoom: 19 }).addTo(map);
  }, [style, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    const filtered = nodes.filter(
      (n) => filterRisks.includes(n.risk_level) && filterSources.includes(n.source_type),
    );

    const group: L.LayerGroup = showClusters
      // @ts-expect-error markercluster augments L
      ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 })
      : L.layerGroup();

    filtered.forEach((n) => {
      const m = L.marker([n.latitude, n.longitude], { icon: makeIcon(n.risk_level) });
      const img = n.image_url
        ? `<img src="${n.image_url}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />`
        : "";
      m.bindPopup(
        `<div style="min-width:200px;max-width:240px;">
          ${img}
          <div style="font-weight:600;font-size:12px;margin-bottom:2px;">${escapeHtml(n.title)}</div>
          <div style="font-size:11px;opacity:0.8;">${SOURCE_LABEL[n.source_type]} · ${RISK_LABEL[n.risk_level]}</div>
          <div style="font-size:11px;opacity:0.7;margin-top:2px;">${n.latitude.toFixed(3)}, ${n.longitude.toFixed(3)}</div>
          <div style="font-size:11px;opacity:0.7;">${new Date(n.created_at).toUTCString().slice(0, 22)}</div>
        </div>`,
        { closeButton: false },
      );
      m.on("mouseover", () => m.openPopup());
      m.on("click", () => onSelect(n));
      group.addLayer(m);
    });

    group.addTo(map);
    layerRef.current = group;

    if (showHeatmap && filtered.length > 0) {
      const points = filtered.map(
        (n) =>
          [
            n.latitude,
            n.longitude,
            n.risk_level === "high" ? 1 : n.risk_level === "medium" ? 0.6 : 0.3,
          ] as [number, number, number],
      );
      // @ts-expect-error leaflet.heat augments L
      heatRef.current = L.heatLayer(points, { radius: 28, blur: 22, maxZoom: 9 }).addTo(map);
    }
  }, [nodes, filterRisks, filterSources, showHeatmap, showClusters, onSelect, ready]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
