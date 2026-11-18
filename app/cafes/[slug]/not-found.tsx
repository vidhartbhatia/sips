// design-rules: enforced
import { NotFoundView } from "@/components/ui/NotFoundView";

export default function CafeNotFound() {
  return (
    <NotFoundView
      title="Cafe not found"
      body="It isn't in our journal (yet)."
      href="/cafes"
      linkLabel="All cafes"
    />
  );
}
