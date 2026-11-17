export type MapProvider = "mapbox" | "leaflet";

export function getMapProvider(): MapProvider {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER;
  if (provider === "leaflet") return "leaflet";
  return "mapbox";
}

export const SEATTLE_CENTER = {
  lat: 47.6062,
  lng: -122.3321,
} as const;

export const DEFAULT_ZOOM = 12;
