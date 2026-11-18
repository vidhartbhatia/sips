// design-rules: enforced
import { Illustration } from "@/components/ui/Illustration";

interface WishListItem {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  source: string;
  notes: string | null;
}

interface WishListProps {
  items: WishListItem[];
}

export default function WishList({ items }: WishListProps) {
  if (items.length === 0) {
    return (
      <div className="mt-16 text-center">
        <Illustration slot="empty" className="mx-auto mb-6 h-auto w-28" />
        <p className="font-heading text-2xl text-espresso-muted">
          No spots on the list yet
        </p>
        <p className="mt-2 text-sm text-espresso-muted">
          Import from Google Maps or add manually in the admin panel
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-10 space-y-4">
      {items.map((place) => (
        <li
          key={place.id}
          className="rounded-xl border border-espresso/[0.12] bg-stone p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Illustration slot="coffee" className="mt-0.5 h-6 w-6 shrink-0 object-contain" />
              <div>
                <h3 className="font-heading text-xl text-espresso">
                  {place.name}
                </h3>
                {place.address && (
                  <p className="text-sm text-espresso-muted">{place.address}</p>
                )}
                {place.notes && (
                  <p className="mt-2 text-sm italic text-espresso-muted">
                    &ldquo;{place.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-espresso/[0.1] px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-espresso-muted">
              {place.source === "google_maps"
                ? "Google Maps"
                : "added by us"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
