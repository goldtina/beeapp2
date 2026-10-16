import { cn } from "@/lib/utils";

/** Original Bee Ready mark: a honeycomb hexagon holding a geometric bee. */
export function BeeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden>
      <path d="M24 2 43 13v22L24 46 5 35V13z" className="fill-honey" />
      <path d="M24 2 43 13v22L24 46 5 35V13z" className="fill-none stroke-charcoal" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="17" cy="19" rx="6" ry="4" transform="rotate(-25 17 19)" className="fill-cream stroke-charcoal" strokeWidth="1.8" />
      <ellipse cx="31" cy="19" rx="6" ry="4" transform="rotate(25 31 19)" className="fill-cream stroke-charcoal" strokeWidth="1.8" />
      <ellipse cx="24" cy="28" rx="7" ry="9" className="fill-charcoal" />
      <path d="M17.6 25h12.8M17.4 30h13.2" className="stroke-honey" strokeWidth="2.2" />
      <circle cx="24" cy="17.5" r="3.4" className="fill-charcoal" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BeeMark />
      <span className="leading-none">
        <span className={cn("font-display text-xl font-semibold", inverted ? "text-cream" : "text-charcoal")}>Bee Ready</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Agency</span>
      </span>
    </span>
  );
}
