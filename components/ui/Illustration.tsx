// design-rules: enforced
import Image from "next/image";
import {
  DOODLES,
  ILLUSTRATIONS,
  ORNAMENTS,
  type Asset,
  type DoodleSlot,
  type IllustrationSlot,
  type OrnamentSlot,
} from "@/lib/illustrations";

type Slot = IllustrationSlot | DoodleSlot | OrnamentSlot;

const ASSETS: Partial<Record<Slot, Asset>> = { ...ILLUSTRATIONS, ...DOODLES, ...ORNAMENTS };

interface IllustrationProps {
  slot: Slot;
  /** Empty (the default) marks the image decorative and hides it from assistive tech. */
  alt?: string;
  className?: string;
  /** Preload above-the-fold art such as the hero. */
  priority?: boolean;
}

/** Renders a named illustration slot. An unset doodle or ornament slot renders nothing. */
export function Illustration({ slot, alt = "", className, priority = false }: IllustrationProps) {
  const asset = ASSETS[slot];
  if (!asset) return null;

  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={className}
      preload={priority}
      // SVGs are served as-is; the optimizer only handles raster art (K1 may add WebP).
      unoptimized={asset.src.endsWith(".svg")}
    />
  );
}
