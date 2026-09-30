import { Star, StarHalf } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils/cn";

/** Displays a 0-5 star rating. Renders nothing when there are no ratings (never fake a score). */
export function Rating({ value, count, size = 16, className }: { value: number; count: number; size?: number; className?: string }) {
  if (!count) return null;
  const stars = Array.from({ length: 5 }, (_, index) => {
    const fill = value - index;
    if (fill >= 0.75) return <Star key={index} size={size} weight="fill" className="text-gold-400" />;
    if (fill >= 0.25) return <StarHalf key={index} size={size} weight="fill" className="text-gold-400" />;
    return <Star key={index} size={size} className="text-navy-200" />;
  });
  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      <span className="flex" aria-hidden="true">
        {stars}
      </span>
      <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      <span className="text-muted">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5 from {count} reviews
      </span>
    </div>
  );
}
