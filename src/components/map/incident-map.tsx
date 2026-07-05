"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, Locate, Maximize, Minimize, Search, X } from "lucide-react";

export type MapIncident = {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  locationLat: number;
  locationLng: number;
  locationText: string | null;
  createdAt: string;
  isAnonymous: boolean;
  guestName: string | null;
  reportedBy: { name: string };
  _count: { votes: number };
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

// All free — no API key required
const MAP_STYLES: Record<string, string | object> = {
  Streets: "https://tiles.openfreemap.org/styles/liberty",
  Bright: "https://tiles.openfreemap.org/styles/bright",
  Minimal: "https://tiles.openfreemap.org/styles/positron",
  Satellite: {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri, Maxar, GeoEye, Earthstar Geographics",
        maxzoom: 19,
      },
      labels: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri",
        maxzoom: 19,
      },
    },
    layers: [
      { id: "satellite-layer", type: "raster", source: "satellite" },
      { id: "labels-layer", type: "raster", source: "labels" },
    ],
  },
};

type StyleName = keyof typeof MAP_STYLES;

interface IncidentMapProps {
  incidents: MapIncident[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export default function IncidentMap({
  incidents,
  center = [6.5244, 3.3792],
  zoom = 14,
  height = "100%",
}: IncidentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [activeStyle, setActiveStyle] = useState<StyleName>("Streets");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build GeoJSON from incidents
  const buildGeoJSON = useCallback(
    (list: MapIncident[]): GeoJSON.FeatureCollection => ({
      type: "FeatureCollection",
      features: list.map((inc) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [inc.locationLng, inc.locationLat] },
        properties: {
          id: inc.id,
          title: inc.title,
          category: inc.category,
          severity: inc.severity,
          status: inc.status,
          locationText: inc.locationText ?? "",
          votes: inc._count.votes,
          color: SEVERITY_COLORS[inc.severity] ?? "#6366f1",
        },
      })),
    }),
    []
  );

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES["Streets"] as maplibregl.StyleSpecification | string,
      center: [center[1], center[0]],
      zoom,
      maxZoom: 20,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      const geojson = buildGeoJSON(incidents);

      // Clustered source
      map.addSource("incidents", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 50,
      });

      // Cluster circle
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "incidents",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step", ["get", "point_count"],
            "#6366f1", 5, "#f59e0b", 20, "#ef4444",
          ],
          "circle-radius": ["step", ["get", "point_count"], 20, 5, 28, 20, 36],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.9,
        },
      });

      // Cluster count label
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "incidents",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Noto Sans Bold"],
          "text-size": 13,
        },
        paint: { "text-color": "#fff" },
      });

      // Individual incident pin
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "incidents",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 10,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.9,
        },
      });

      // Popup on single pin click
      map.on("click", "unclustered-point", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const props = feat.properties as Record<string, unknown>;
        const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number];

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ maxWidth: "240px", offset: 12 })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family:system-ui;font-size:13px;line-height:1.5;min-width:180px">
              <p style="font-weight:700;margin:0 0 4px">${props.title}</p>
              <p style="color:#6b7280;margin:0 0 2px">${String(props.locationText ?? "")}</p>
              <p style="color:#6b7280;margin:0 0 8px">
                ${Number(props.votes) > 0 ? `👍 ${props.votes} affected · ` : ""}
                <span style="text-transform:capitalize">${String(props.status ?? "").toLowerCase().replace(/_/g, " ")}</span>
              </p>
              <a href="/i/${String(props.id)}" style="color:#2563eb;font-weight:600;text-decoration:none">
                View details →
              </a>
            </div>`
          )
          .addTo(map);
      });

      // Zoom into cluster on click
      map.on("click", "clusters", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const src = map.getSource("incidents") as maplibregl.GeoJSONSource;
        src.getClusterExpansionZoom(feat.properties!.cluster_id as number).then((z) => {
          const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number];
          map.easeTo({ center: coords, zoom: z });
        });
      });

      map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data when incidents change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("incidents") as maplibregl.GeoJSONSource | undefined;
    src?.setData(buildGeoJSON(incidents));
  }, [incidents, buildGeoJSON]);

  // Switch map style
  const switchStyle = useCallback((name: StyleName) => {
    const map = mapRef.current;
    if (!map) return;
    setActiveStyle(name);
    setShowStylePicker(false);
    const style = MAP_STYLES[name];
    map.setStyle(style as maplibregl.StyleSpecification | string);
    // Re-add sources/layers after style load
    map.once("styledata", () => {
      if (map.getSource("incidents")) return;
      const geojson = buildGeoJSON(incidents);
      map.addSource("incidents", { type: "geojson", data: geojson, cluster: true, clusterMaxZoom: 15, clusterRadius: 50 });
      map.addLayer({ id: "clusters", type: "circle", source: "incidents", filter: ["has", "point_count"], paint: { "circle-color": ["step", ["get", "point_count"], "#6366f1", 5, "#f59e0b", 20, "#ef4444"], "circle-radius": ["step", ["get", "point_count"], 20, 5, 28, 20, 36], "circle-stroke-width": 2, "circle-stroke-color": "#fff", "circle-opacity": 0.9 } });
      map.addLayer({ id: "cluster-count", type: "symbol", source: "incidents", filter: ["has", "point_count"], layout: { "text-field": "{point_count_abbreviated}", "text-font": ["Noto Sans Bold"], "text-size": 13 }, paint: { "text-color": "#fff" } });
      map.addLayer({ id: "unclustered-point", type: "circle", source: "incidents", filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["get", "color"], "circle-radius": 10, "circle-stroke-width": 2, "circle-stroke-color": "#fff", "circle-opacity": 0.9 } });
    });
  }, [incidents, buildGeoJSON]);

  // Locate me
  const locateMe = useCallback(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16, speed: 1.4 });
    });
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  // Search with Nominatim
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 3) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        setSearchResults(await res.json());
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const selectResult = (r: SearchResult) => {
    mapRef.current?.flyTo({ center: [parseFloat(r.lon), parseFloat(r.lat)], zoom: 16, speed: 1.4 });
    setSearchQuery(r.display_name.split(",").slice(0, 2).join(","));
    setSearchResults([]);
  };

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Search bar */}
      <div className="absolute top-3 left-3 right-14 z-10 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search any city or location worldwide…"
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white shadow-lg rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Search results dropdown */}
        {(searchResults.length > 0 || searchLoading) && (
          <div className="mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            {searchLoading && (
              <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
            )}
            {searchResults.map((r) => (
              <button
                key={r.place_id}
                onClick={() => selectResult(r)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-start gap-2"
              >
                <span className="text-blue-500 mt-0.5 shrink-0">📍</span>
                <span className="line-clamp-2 text-gray-700">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls — top right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {/* Style switcher */}
        <div className="relative">
          <button
            onClick={() => setShowStylePicker((p) => !p)}
            className="w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Change map style"
          >
            <Layers className="h-4 w-4 text-gray-600" />
          </button>
          {showStylePicker && (
            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden w-36">
              {(Object.keys(MAP_STYLES) as StyleName[]).map((name) => (
                <button
                  key={name}
                  onClick={() => switchStyle(name)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    activeStyle === name
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {name === "Streets" && "🗺️ "}
                  {name === "Bright" && "☀️ "}
                  {name === "Minimal" && "⬜ "}
                  {name === "Satellite" && "🛰️ "}
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Locate me */}
        <button
          onClick={locateMe}
          className="w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Go to my location"
        >
          <Locate className="h-4 w-4 text-gray-600" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Toggle fullscreen"
        >
          {isFullscreen
            ? <Minimize className="h-4 w-4 text-gray-600" />
            : <Maximize className="h-4 w-4 text-gray-600" />
          }
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 px-3 py-2 flex gap-3 flex-wrap">
        {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
          <span key={sev} className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
            {sev.charAt(0) + sev.slice(1).toLowerCase()}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
          <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: "#6366f1" }}>N</span>
          Cluster
        </span>
      </div>
    </div>
  );
}
