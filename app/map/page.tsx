import MapView from "@/components/map/MapView";
import { getCafesForMap } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Map" };

export default async function MapPage() {
  const cafes = await getCafesForMap();
  return <MapView cafes={cafes} />;
}
