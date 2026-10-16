import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label} {icon}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="honeycomb rounded-3xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      Couldn't load this section: {error instanceof Error ? error.message : "please refresh."}
    </div>
  );
}

export function ScorePill({ score }: { score: number }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
      score >= 80 ? "bg-honey text-charcoal" : score >= 60 ? "bg-honey-soft text-charcoal" : "bg-muted text-muted-foreground")}>
      {score}% match
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  applied: "bg-secondary text-secondary-foreground",
  offered: "bg-honey text-charcoal",
  confirmed: "bg-success text-success-foreground",
  completed: "bg-charcoal text-charcoal-foreground",
  declined: "bg-muted text-muted-foreground",
  rejected: "bg-muted text-muted-foreground",
  open: "bg-honey-soft text-charcoal",
  filled: "bg-success text-success-foreground",
  cancelled: "bg-muted text-muted-foreground",
};
export function StatusBadge({ status }: { status: string }) {
  return <Badge className={cn("rounded-full border-0 capitalize", STATUS_STYLES[status])}>{status}</Badge>;
}

export function DemoBadge() {
  return <Badge variant="outline" className="rounded-full border-dashed text-[10px] uppercase tracking-wider">Demo data</Badge>;
}

export function ChipPicker({ options, value, onChange }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", on ? "border-honey bg-honey text-charcoal" : "border-border bg-card hover:border-honey/60")}>
            {o}
          </button>
        );
      })}
    </div>
  );
}
