"use client";

import { useState, useCallback, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { motion, AnimatePresence } from "framer-motion";
import "mapbox-gl/dist/mapbox-gl.css";

import Header from "@/components/layout/Header";
import CafePin from "@/components/map/CafePin";
import SipsRating from "@/components/ui/SipsRating";
import { SEATTLE_CENTER, DEFAULT_ZOOM } from "@/lib/map/provider";

interface Cafe {
  id: string;
  name: string;
  slug: string;
  neighborhood: string;
  lat: number;
  lng: number;
  overall_rating: number | null;
  cover_photo_url: string | null;
  vibe_tags: string[];
}

interface MapViewProps {
  cafes: Cafe[];
}

export default function MapView({ cafes }: MapViewProps) {
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNeighborhood, setActiveNeighborhood] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [minRating, setMinRating] = useState(0);

  const neighborhoods = useMemo(() => {
    const hoods = Array.from(new Set(cafes.map((c) => c.neighborhood)))
      .filter(Boolean)
      .sort();
    return ["All", ...hoods];
  }, [cafes]);

  const filteredCafes = useMemo(() => {
    return cafes.filter((c) => {
      if (activeNeighborhood !== "All" && c.neighborhood !== activeNeighborhood) return false;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (minRating > 0 && (c.overall_rating ?? 0) < minRating) return false;
      return true;
    });
  }, [cafes, activeNeighborhood, searchQuery, minRating]);

  const handleMarkerClick = useCallback((cafe: Cafe) => {
    setSelectedCafe(cafe);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <div className="relative flex-1">
        {/* Filter Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 z-10 h-full w-72 border-r border-espresso/10 bg-cream/95 backdrop-blur-sm"
            >
              <div className="flex h-full flex-col p-5">
                {/* Sidebar Header */}
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-heading text-xl font-bold text-espresso">
                    Explore
                  </h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-full p-1 text-espresso-muted transition-colors hover:bg-espresso/10 hover:text-espresso"
                    aria-label="Close sidebar"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M15 5L5 15M5 5l10 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Search (placeholder) */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 rounded-lg border border-espresso/15 bg-white/60 px-3 py-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-espresso-muted"
                    >
                      <circle
                        cx="7"
                        cy="7"
                        r="5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M11 11l3 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search cafes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-sm text-espresso outline-none placeholder:text-espresso-muted/50"
                    />
                  </div>
                </div>

                {/* Neighborhood Filters */}
                <div className="mb-5">
                  <h3 className="mb-3 font-heading text-sm font-medium uppercase tracking-wide text-espresso-muted">
                    Neighborhood
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {neighborhoods.map((hood) => (
                      <button
                        key={hood}
                        onClick={() => setActiveNeighborhood(hood)}
                        className={`rounded-lg px-3 py-2 text-left font-heading text-sm transition-all ${
                          activeNeighborhood === hood
                            ? "bg-terracotta/15 text-terracotta"
                            : "text-espresso-muted hover:bg-espresso/5 hover:text-espresso"
                        }`}
                      >
                        {hood}
                        <span className="ml-2 text-xs opacity-60">
                          (
                          {hood === "All"
                            ? cafes.length
                            : cafes.filter(
                                (c) => c.neighborhood === hood
                              ).length}
                          )
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Filter (placeholder) */}
                <div className="mb-5">
                  <h3 className="mb-3 font-heading text-sm font-medium uppercase tracking-wide text-espresso-muted">
                    Min Rating
                  </h3>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(minRating === r ? 0 : r)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors ${
                          minRating === r
                            ? "border-terracotta bg-terracotta/15 text-terracotta"
                            : "border-espresso/[0.12] text-espresso-muted hover:border-terracotta hover:text-terracotta"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <svg
                  className="my-2 w-full"
                  height="3"
                  viewBox="0 0 260 3"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,1.5 C80,0.5 160,2.5 260,1.5"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                    className="text-espresso/10"
                  />
                </svg>

                {/* Cafe List */}
                <div className="mt-3 flex-1 overflow-y-auto">
                  <h3 className="mb-3 font-heading text-sm font-medium uppercase tracking-wide text-espresso-muted">
                    Cafes
                  </h3>
                  <div className="flex flex-col gap-2">
                    {filteredCafes.map((cafe) => (
                      <button
                        key={cafe.id}
                        onClick={() => setSelectedCafe(cafe)}
                        className={`rounded-lg px-3 py-2.5 text-left transition-all ${
                          selectedCafe?.id === cafe.id
                            ? "bg-terracotta/10 ring-1 ring-terracotta/30"
                            : "hover:bg-espresso/5"
                        }`}
                      >
                        <p className="font-heading text-sm font-semibold text-espresso">
                          {cafe.name}
                        </p>
                        <p className="font-heading text-xs text-espresso-muted">
                          {cafe.neighborhood}
                        </p>
                        {cafe.overall_rating != null && (
                          <div className="mt-1">
                            <SipsRating sips={cafe.overall_rating} size={22} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle Button (visible when sidebar is closed) */}
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 top-3 z-10 rounded-lg border border-espresso/15 bg-cream/95 px-3 py-2 shadow-md backdrop-blur-sm transition-colors hover:bg-cream"
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="#3D2C2C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.button>
        )}

        {/* Map */}
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={{
            latitude: SEATTLE_CENTER.lat,
            longitude: SEATTLE_CENTER.lng,
            zoom: DEFAULT_ZOOM,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          <NavigationControl position="bottom-right" />

          {/* Cafe Markers */}
          {filteredCafes.map((cafe) => (
            <Marker
              key={cafe.id}
              latitude={cafe.lat}
              longitude={cafe.lng}
              anchor="bottom"
              onClick={(e: { originalEvent: MouseEvent }) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(cafe);
              }}
            >
              <CafePin
                type="reviewed"
                rating={cafe.overall_rating ?? undefined}
                selected={selectedCafe?.id === cafe.id}
              />
            </Marker>
          ))}

          {/* Popup */}
          {selectedCafe && (
            <Popup
              latitude={selectedCafe.lat}
              longitude={selectedCafe.lng}
              anchor="bottom"
              offset={40}
              closeOnClick={false}
              onClose={() => setSelectedCafe(null)}
              className="sips-popup"
            >
              <div className="w-52 p-1">
                <h3 className="font-heading text-base font-semibold text-espresso">
                  {selectedCafe.name}
                </h3>
                <p className="font-heading text-xs text-espresso-muted">
                  {selectedCafe.neighborhood}
                </p>
                {selectedCafe.overall_rating != null && (
                  <div className="mt-1.5">
                    <SipsRating sips={selectedCafe.overall_rating} size={22} />
                  </div>
                )}
                <a
                  href={`/cafes/${selectedCafe.slug}`}
                  className="mt-2 inline-block font-heading text-sm text-terracotta hover:text-terracotta-dark"
                >
                  read review &rarr;
                </a>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
