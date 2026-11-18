// design-rules: enforced

interface VisitStoryProps {
  paragraphs: string[];
  testId?: string;
  /** Inside an earlier visit: tighter spacing, body-size text. */
  compact?: boolean;
}

/** The visit's story, one `<p>` per paragraph. Nothing at all when there is no story. */
export function VisitStory({ paragraphs, testId, compact = false }: VisitStoryProps) {
  if (paragraphs.length === 0) return null;

  return (
    <div data-testid={testId} className={`max-w-[65ch] leading-relaxed text-pretty text-espresso ${compact ? "mt-6 space-y-4 text-base" : "mt-14 space-y-5 text-lg"}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
