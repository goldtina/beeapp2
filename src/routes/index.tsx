import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Clock, MapPin, ShieldCheck, Siren, Sparkles, Star, Zap } from "lucide-react";
import heroImg from "@/assets/hero-bartender.jpg";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { BeeMark } from "@/components/Logo";
import { MapView } from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CENTER } from "@/lib/constants";
import { gbp, shiftWhen } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bee Ready Agency — Short Staffed? Bee Ready." },
      { name: "description", content: "Connecting pubs, restaurants, bars, cafés and hotels with reliable, ready-to-work hospitality professionals in minutes." },
      { property: "og:title", content: "Bee Ready Agency — Short Staffed? Bee Ready." },
      { property: "og:description", content: "The Right Staff, Right When You Need Them. Short-notice hospitality staffing with Bee Match and Bee SOS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useLanding() {
  return useQuery({
    queryKey: ["landing"],
    queryFn: async () => {
      const [shifts, workers] = await Promise.all([
        supabase
          .from("shifts")
          .select("id, role, title, starts_at, ends_at, hourly_rate, workers_needed, location_name, lat, lng, is_urgent, business:business_profiles(name, business_type)")
          .eq("status", "open")
          .gte("ends_at", new Date().toISOString())
          .order("is_urgent", { ascending: false })
          .order("starts_at")
          .limit(6),
        supabase
          .from("worker_profiles")
          .select("user_id, full_name, headline, roles, experience_years, rating, rating_count, area_name, lat, lng")
          .eq("ready_to_work", true)
          .order("rating", { ascending: false })
          .limit(6),
      ]);
      if (shifts.error) throw shifts.error;
      if (workers.error) throw workers.error;
      return { shifts: shifts.data, workers: workers.data };
    },
  });
}

function Index() {
  const { data, isLoading, error } = useLanding();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="honeycomb relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="animate-rise">
            <Badge className="rounded-full border-honey/40 bg-honey-soft px-3 py-1 text-charcoal" variant="outline">
              <Zap className="mr-1 h-3.5 w-3.5" /> Shifts filled in minutes, not days
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Short Staffed? <span className="relative whitespace-nowrap">
                <span className="relative z-10">Bee Ready.</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-4 rounded bg-honey/60" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Connecting hospitality businesses with reliable, ready-to-work professionals in minutes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="xl">
                <Link to="/auth" search={{ as: "business" }}>I Need Staff <ArrowRight /></Link>
              </Button>
              <Button asChild variant="dark" size="xl">
                <Link to="/auth" search={{ as: "worker" }}>I'm Ready to Work</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Judges: one-click demo accounts on the <Link to="/auth" className="font-semibold text-foreground underline underline-offset-4">sign-in page</Link>.
            </p>
          </div>
          <div className="relative animate-rise [animation-delay:150ms]">
            <div className="overflow-hidden rounded-[2rem] border-4 border-card shadow-lift">
              <img src={heroImg} alt="Hospitality professional behind a pub bar" width={1200} height={1408} className="h-[480px] w-full object-cover sm:h-[560px]" />
            </div>
            <div className="absolute -left-4 bottom-10 max-w-[260px] rounded-2xl border border-border bg-card p-4 shadow-lift sm:-left-10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sos">
                <Siren className="h-4 w-4" /> Bee SOS
              </div>
              <p className="mt-1 text-sm font-semibold">The Harbour Pub needs 2 bartenders tonight</p>
              <p className="text-xs text-muted-foreground">6 PM–11 PM · £16/hour</p>
            </div>
            <div className="absolute -right-2 top-8 rounded-2xl bg-charcoal px-4 py-3 text-charcoal-foreground shadow-lift sm:-right-6">
              <p className="font-display text-2xl text-honey">95%</p>
              <p className="text-xs text-charcoal-foreground/70">Bee Match score</p>
            </div>
            <BeeMark className="absolute -top-6 left-10 h-12 w-12 animate-buzz" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="How Bee Ready works" title="From empty rota to full team in three steps" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Post or get ready", d: "Businesses post a shift — or hit Bee SOS for tonight. Workers flip their Ready to Work switch." },
            { n: "02", t: "Bee Match finds the fit", d: "Our transparent scoring weighs role, skills, distance, pay, experience and timing — and shows you why." },
            { n: "03", t: "Confirm & get to work", d: "Workers apply, businesses confirm in one tap. Both dashboards update instantly. No double-bookings." },
          ].map((s) => (
            <div key={s.n} className="card-hover rounded-3xl border border-border bg-card p-8 shadow-soft">
              <span className="font-display text-4xl text-honey">{s.n}</span>
              <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Urgent shifts + map */}
      <section className="bg-charcoal text-charcoal-foreground">
        <div className="honeycomb">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <SectionTitle eyebrow="Urgent shifts" title="Live shifts near Tower Bridge" inverted />
            {error ? (
              <p className="mt-8 text-sos">Couldn't load shifts right now. Please refresh.</p>
            ) : (
              <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
                <div className="grid gap-3">
                  {isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-charcoal-foreground/10" />)}
                  {data?.shifts.length === 0 && <p className="text-charcoal-foreground/70">No open shifts right now — check back soon.</p>}
                  {data?.shifts.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-charcoal-foreground/10 bg-charcoal-foreground/5 p-5 transition-colors hover:border-honey/60">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {s.is_urgent && <span className="rounded-full bg-sos px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sos-foreground">SOS</span>}
                            <span className="text-sm text-charcoal-foreground/60">{s.business?.name}</span>
                          </div>
                          <p className="mt-1 font-semibold">{s.workers_needed} × {s.role}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal-foreground/60"><Clock className="h-3.5 w-3.5" /> {shiftWhen(s.starts_at, s.ends_at)}</p>
                        </div>
                        <p className="font-display text-2xl text-honey">{gbp(Number(s.hourly_rate))}<span className="text-xs text-charcoal-foreground/60">/h</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                <MapView
                  height={460}
                  center={DEFAULT_CENTER}
                  points={[
                    ...(data?.shifts ?? []).map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, kind: "shift" as const, urgent: s.is_urgent, label: `${s.business?.name}: ${s.role}` })),
                    ...(data?.workers ?? []).filter((w) => w.lat != null).map((w) => ({ id: w.user_id, lat: w.lat!, lng: w.lng!, kind: "worker" as const, label: `${w.full_name.split(" ")[0]} · approx. ${w.area_name}` })),
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Available workers */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Available workers" title="Ready to work right now" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />)}
          {data?.workers.map((w) => (
            <div key={w.user_id} className="card-hover rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-honey font-display text-lg font-semibold">
                  {w.full_name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold">{w.full_name.split(" ")[0]} {w.full_name.split(" ")[1]?.[0]}.</p>
                  <p className="text-sm text-muted-foreground">{w.headline}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {w.roles.map((r) => <Badge key={r} variant="secondary" className="rounded-full">{r}</Badge>)}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> ~{w.area_name}</span>
                <span className="flex items-center gap-1 font-semibold text-foreground"><Star className="h-3.5 w-3.5 fill-honey text-honey" /> {w.rating} <span className="font-normal text-muted-foreground">({w.rating_count})</span></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="bg-secondary/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="Why choose Bee Ready" title="Built for the reality of hospitality" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { i: Siren, t: "Bee SOS", d: "Emergency requests jump to the top of every suitable worker's dashboard instantly." },
              { i: Sparkles, t: "Explainable matching", d: "Bee Match is rule-based and transparent — every score shows its reasons." },
              { i: ShieldCheck, t: "Privacy first", d: "Workers appear only in their approximate area. Never an exact home address." },
              { i: BadgeCheck, t: "No double-booking", d: "Overlapping confirmed shifts are blocked automatically at the database level." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="card-hover rounded-3xl border border-border bg-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-honey-soft"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="What people could say" title="Testimonials" />
        <p className="mt-3 text-center text-sm text-muted-foreground">
          <Badge variant="outline" className="rounded-full">Demo examples</Badge> These are illustrative, fictional quotes — not real customers.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { q: "Two bartenders called in sick at 4 PM. We had cover confirmed by 4:20.", a: "Pub manager (demo)" },
            { q: "I pick up evening shifts around my studies, close to home, at a rate I set.", a: "Student bartender (demo)" },
            { q: "Seeing why someone matched — skills, distance, rate — makes it easy to say yes.", a: "Hotel ops lead (demo)" },
          ].map((t) => (
            <figure key={t.a} className="rounded-3xl border border-dashed border-border bg-card p-7">
              <blockquote className="font-display text-xl leading-snug">“{t.q}”</blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">— {t.a}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-honey">
          <div className="honeycomb flex flex-col items-center gap-6 px-6 py-16 text-center">
            <h2 className="max-w-2xl text-4xl font-semibold sm:text-5xl">The Right Staff, Right When You Need Them.</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="dark" size="xl"><Link to="/auth" search={{ as: "business" }}>I Need Staff</Link></Button>
              <Button asChild variant="outline" size="xl" className="rounded-full border-charcoal bg-transparent"><Link to="/auth" search={{ as: "worker" }}>I'm Ready to Work</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SectionTitle({ eyebrow, title, inverted }: { eyebrow: string; title: string; inverted?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-honey">{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-semibold sm:text-4xl ${inverted ? "text-charcoal-foreground" : ""}`}>{title}</h2>
    </div>
  );
}
