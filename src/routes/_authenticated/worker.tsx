import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Check, Clock, Info, Loader2, LocateFixed, MapPin, PoundSterling, Siren, Star, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MapView } from "@/components/MapView";
import { ChipPicker, DemoBadge, Empty, ErrorBox, ScorePill, StatCard, StatusBadge } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { beeMatch, type MatchResult } from "@/lib/bee-match";
import { AREAS, DEFAULT_CENTER, HOSPITALITY_ROLES, SKILLS } from "@/lib/constants";
import { errMsg, gbp, shiftHours, shiftWhen } from "@/lib/format";
import { fetchMyApplications, fetchOpenShifts, fetchWorker, type ShiftWithBusiness, type WorkerProfile } from "@/lib/queries";
import { useMe } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/worker")({
  head: () => ({ meta: [{ title: "Worker dashboard — Bee Ready Agency" }, { name: "description", content: "Find, apply for and manage hospitality shifts." }] }),
  component: WorkerDashboard,
});

function WorkerDashboard() {
  const uid = Route.useRouteContext().user.id;
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (me.data && me.data.role !== "worker") navigate({ to: "/dashboard", replace: true });
  }, [me.data, navigate]);

  const profile = useQuery({ queryKey: ["worker", uid], queryFn: () => fetchWorker(uid) });
  const shifts = useQuery({ queryKey: ["open-shifts"], queryFn: fetchOpenShifts });
  const apps = useQuery({ queryKey: ["my-apps", uid], queryFn: () => fetchMyApplications(uid) });

  // Realtime: Bee SOS + application updates
  const profileRef = useRef<WorkerProfile | null>(null);
  profileRef.current = profile.data ?? null;
  useEffect(() => {
    const ch = supabase
      .channel(`worker-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, (payload) => {
        qc.invalidateQueries({ queryKey: ["open-shifts"] });
        const s = payload.new as ShiftWithBusiness;
        const p = profileRef.current;
        if (payload.eventType === "INSERT" && s.is_urgent && p?.ready_to_work) {
          const m = beeMatch(p, s);
          if (m.score >= 60) toast.warning(`Bee SOS: ${s.workers_needed} × ${s.role} needed — ${shiftWhen(s.starts_at, s.ends_at)}`, { description: m.summary, duration: 10000 });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `worker_id=eq.${uid}` }, () => {
        qc.invalidateQueries({ queryKey: ["my-apps", uid] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, qc]);

  const appliedIds = new Set((apps.data ?? []).map((a) => a.shift_id));
  const matches = useMemo(() => {
    if (!profile.data || !shifts.data) return [];
    return shifts.data
      .map((s) => ({ shift: s, match: beeMatch(profile.data!, s) }))
      .sort((a, b) => Number(b.shift.is_urgent && b.match.score >= 60) - Number(a.shift.is_urgent && a.match.score >= 60) || b.match.score - a.match.score);
  }, [profile.data, shifts.data]);
  const sos = matches.filter((m) => m.shift.is_urgent && m.match.score >= 60 && !appliedIds.has(m.shift.id));

  const toggleReady = useMutation({
    mutationFn: async (v: boolean) => {
      const { error } = await supabase.from("worker_profiles").update({ ready_to_work: v }).eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["worker", uid] });
      toast.success(v ? "You're Ready to Work — businesses can now find you." : "You're hidden from new offers.");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const apply = useMutation({
    mutationFn: async ({ shiftId, score }: { shiftId: string; score: number }) => {
      const { error } = await supabase.rpc("apply_to_shift", { _shift_id: shiftId, _match_score: score });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-apps", uid] });
      toast.success("Application sent! The business will be notified.");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const respond = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase.rpc("respond_to_application", { _app_id: id, _accept: accept });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries();
      toast.success(v.accept ? "Shift confirmed — see you there!" : "Offer declined.");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (profile.isLoading) return <PageLoading />;
  if (profile.error) return <div className="p-8"><ErrorBox error={profile.error} /></div>;
  const p = profile.data;
  if (!p) return <PageLoading />;

  const all = apps.data ?? [];
  const offers = all.filter((a) => a.status === "offered");
  const confirmed = all.filter((a) => a.status === "confirmed");
  const completed = all.filter((a) => a.status === "completed");
  const pending = all.filter((a) => a.status === "applied");
  const earned = completed.reduce((t, a) => t + shiftHours(a.shift.starts_at, a.shift.ends_at) * Number(a.shift.hourly_rate), 0);
  const upcoming = confirmed.reduce((t, a) => t + shiftHours(a.shift.starts_at, a.shift.ends_at) * Number(a.shift.hourly_rate), 0);
  const profileIncomplete = p.roles.length === 0 || p.lat == null;

  return (
    <div className="min-h-screen pb-20">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Worker dashboard</p>
              {p.is_demo && <DemoBadge />}
            </div>
            <h1 className="mt-1 text-4xl font-semibold">Hi {p.full_name.split(" ")[0] || "there"} 👋</h1>
          </div>
          <label className={`flex cursor-pointer items-center gap-4 rounded-full border-2 px-5 py-3 transition-all ${p.ready_to_work ? "border-honey bg-honey shadow-honey" : "border-border bg-card"}`}>
            <span>
              <span className="block font-semibold">Ready to Work</span>
              <span className="block text-xs text-charcoal/70">{p.ready_to_work ? "Visible to businesses" : "Hidden from offers"}</span>
            </span>
            <Switch checked={p.ready_to_work} disabled={toggleReady.isPending} onCheckedChange={(v) => toggleReady.mutate(v)} />
          </label>
        </div>

        {profileIncomplete && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-honey bg-honey-soft p-4 text-sm">
            <Info className="h-4 w-4 shrink-0" /> Add your roles and approximate area in the Profile tab so Bee Match can find shifts for you.
          </div>
        )}

        {sos.length > 0 && (
          <div className="mt-6 animate-pulse-sos rounded-3xl border-2 border-sos bg-card p-5">
            <div className="flex items-center gap-2 font-semibold text-sos"><Siren className="h-5 w-5" /> Bee SOS — urgent shifts that match you</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {sos.slice(0, 2).map(({ shift: s, match }) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-4">
                  <div>
                    <p className="font-semibold">{s.business?.name} needs {s.workers_needed} {s.role.toLowerCase()}{s.workers_needed > 1 ? "s" : ""}</p>
                    <p className="text-sm text-muted-foreground">{shiftWhen(s.starts_at, s.ends_at)} · {gbp(Number(s.hourly_rate))}/hour</p>
                  </div>
                  <Button variant="sos" size="sm" disabled={apply.isPending} onClick={() => apply.mutate({ shiftId: s.id, score: match.score })}>Apply</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Upcoming shifts" value={confirmed.length} icon={<CalendarCheck className="h-4 w-4" />} />
          <StatCard label="Upcoming earnings" value={gbp(upcoming)} hint="Estimate, before tax" icon={<PoundSterling className="h-4 w-4" />} />
          <StatCard label="Earned so far" value={gbp(earned)} hint={`${completed.length} completed shifts`} icon={<PoundSterling className="h-4 w-4" />} />
          <StatCard label="Rating" value={<span className="flex items-center gap-1">{p.rating}<Star className="h-5 w-5 fill-honey text-honey" /></span>} hint={`${p.rating_count} reviews`} />
        </div>

        <Tabs defaultValue={offers.length ? "shifts" : "match"} className="mt-8">
          <TabsList className="rounded-full">
            <TabsTrigger value="match" className="rounded-full">Bee Match</TabsTrigger>
            <TabsTrigger value="shifts" className="rounded-full">My shifts {offers.length > 0 && <span className="ml-1.5 rounded-full bg-honey px-1.5 text-xs">{offers.length}</span>}</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="match" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
              <div className="space-y-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5" /> Scores are rule-based (role, skills, distance, pay, experience, timing) — not AI predictions.</p>
                {shifts.isLoading && <Skeletons />}
                {shifts.error && <ErrorBox error={shifts.error} />}
                {shifts.data && matches.length === 0 && <Empty title="No open shifts nearby" body="New shifts appear here in real time. Switch on Ready to Work to get Bee SOS alerts." />}
                {matches.map(({ shift, match }) => (
                  <MatchCard key={shift.id} shift={shift} match={match} applied={appliedIds.has(shift.id)} busy={apply.isPending} onApply={() => apply.mutate({ shiftId: shift.id, score: match.score })} />
                ))}
              </div>
              <div className="lg:sticky lg:top-24 lg:self-start">
                <MapView
                  height={480}
                  center={p.lat != null ? { lat: p.lat, lng: p.lng! } : DEFAULT_CENTER}
                  radiusKm={p.lat != null ? p.travel_radius_km : undefined}
                  points={[
                    ...(p.lat != null ? [{ id: "me", lat: p.lat, lng: p.lng!, kind: "me" as const, label: "Your approximate area" }] : []),
                    ...matches.map(({ shift: s, match }) => ({ id: s.id, lat: s.lat, lng: s.lng, kind: "shift" as const, urgent: s.is_urgent, label: `${s.business?.name} · ${s.role} · ${match.score}%` })),
                  ]}
                />
                <p className="mt-2 text-xs text-muted-foreground">Your location is shown as an approximate area, never an exact address.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shifts" className="mt-6 space-y-8">
            {apps.isLoading && <Skeletons />}
            {apps.error && <ErrorBox error={apps.error} />}
            <Section title="Offers for you" empty="No offers right now. Businesses can offer you shifts when you're Ready to Work.">
              {offers.map((a) => (
                <AppRow key={a.id} a={a}>
                  <Button size="sm" variant="success" disabled={respond.isPending} onClick={() => respond.mutate({ id: a.id, accept: true })}><Check /> Accept</Button>
                  <Button size="sm" variant="outline" disabled={respond.isPending} onClick={() => respond.mutate({ id: a.id, accept: false })}><X /> Decline</Button>
                </AppRow>
              ))}
            </Section>
            <Section title="Confirmed" empty="No confirmed shifts yet.">
              {confirmed.map((a) => <AppRow key={a.id} a={a} />)}
            </Section>
            <Section title="Awaiting response" empty="No pending applications.">
              {pending.map((a) => <AppRow key={a.id} a={a} />)}
            </Section>
            <Section title="Completed" empty="Completed shifts and ratings appear here.">
              {completed.map((a) => <AppRow key={a.id} a={a} />)}
            </Section>
            <Section title="Closed" empty="Nothing here.">
              {all.filter((a) => a.status === "declined" || a.status === "rejected").map((a) => <AppRow key={a.id} a={a} />)}
            </Section>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <WorkerProfileForm p={p} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MatchCard({ shift: s, match, applied, busy, onApply }: { shift: ShiftWithBusiness; match: MatchResult; applied: boolean; busy: boolean; onApply: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card-hover rounded-3xl border bg-card p-5 shadow-soft ${s.is_urgent ? "border-sos/50" : "border-border"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {s.is_urgent && <span className="rounded-full bg-sos px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sos-foreground">Bee SOS</span>}
            <ScorePill score={match.score} />
            {s.is_demo && <DemoBadge />}
          </div>
          <h3 className="mt-2 text-lg font-semibold">{s.role} · {s.business?.name}</h3>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{shiftWhen(s.starts_at, s.ends_at)}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.location_name}{match.distanceKm != null && ` · ${match.distanceKm.toFixed(1)} km`}</span>
          </p>
          <p className="mt-2 text-sm font-medium">{match.summary}</p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <p className="font-display text-2xl font-semibold">{gbp(Number(s.hourly_rate))}<span className="text-xs text-muted-foreground">/h</span></p>
          {applied ? <StatusBadge status="applied" /> : <Button variant="hero" size="sm" disabled={busy} onClick={onApply}>Apply</Button>}
        </div>
      </div>
      <button className="mt-3 text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline" onClick={() => setOpen(!open)}>
        {open ? "Hide" : "Why this score?"}
      </button>
      {open && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {match.factors.map((f) => (
            <div key={f.label} className="rounded-xl bg-muted p-3 text-xs">
              <div className="flex justify-between font-semibold"><span>{f.label}</span><span>{f.points}/{f.max}</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full bg-honey" style={{ width: `${(f.points / f.max) * 100}%` }} /></div>
              <p className="mt-1.5 text-muted-foreground">{f.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children];
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      {arr.filter(Boolean).length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <div className="space-y-3">{children}</div>}
    </div>
  );
}

function AppRow({ a, children }: { a: Awaited<ReturnType<typeof fetchMyApplications>>[number]; children?: React.ReactNode }) {
  const s = a.shift;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2"><StatusBadge status={a.status} />{a.rating && <span className="flex items-center gap-0.5 text-xs"><Star className="h-3 w-3 fill-honey text-honey" />{a.rating}</span>}</div>
        <p className="mt-1 font-semibold">{s.role} · {s.business?.name}</p>
        <p className="text-sm text-muted-foreground">{shiftWhen(s.starts_at, s.ends_at)} · {gbp(Number(s.hourly_rate))}/h · est. {gbp(shiftHours(s.starts_at, s.ends_at) * Number(s.hourly_rate))}</p>
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function WorkerProfileForm({ p }: { p: WorkerProfile }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    full_name: p.full_name, headline: p.headline, bio: p.bio, roles: p.roles, skills: p.skills,
    experience_years: p.experience_years, hourly_rate: Number(p.hourly_rate), area_name: p.area_name,
    lat: p.lat, lng: p.lng, travel_radius_km: p.travel_radius_km,
    available_from: toLocalInput(p.available_from), available_until: toLocalInput(p.available_until),
  });
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("worker_profiles").update({
        ...f,
        available_from: f.available_from ? new Date(f.available_from).toISOString() : null,
        available_until: f.available_until ? new Date(f.available_until).toISOString() : null,
      }).eq("user_id", p.user_id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["worker", p.user_id] }); toast.success("Profile saved"); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  function locate() {
    if (!navigator.geolocation) return toast.error("Location isn't available in this browser");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setF((x) => ({ ...x, lat: pos.coords.latitude, lng: pos.coords.longitude, area_name: x.area_name || "Near me" })); toast.success("Approximate location set (rounded to ~1 km)"); },
      () => toast.error("Couldn't get your location"),
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-soft lg:grid-cols-2">
      <div className="space-y-4">
        <F label="Full name"><Input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} required /></F>
        <F label="Headline"><Input value={f.headline} placeholder="e.g. Cocktail bartender" onChange={(e) => set("headline", e.target.value)} /></F>
        <F label="About you"><Textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} rows={3} /></F>
        <F label="Roles"><ChipPicker options={HOSPITALITY_ROLES} value={f.roles} onChange={(v) => set("roles", v)} /></F>
        <F label="Skills"><ChipPicker options={SKILLS} value={f.skills} onChange={(v) => set("skills", v)} /></F>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <F label="Experience (years)"><Input type="number" min={0} max={60} value={f.experience_years} onChange={(e) => set("experience_years", Number(e.target.value))} /></F>
          <F label="Preferred rate (£/h)"><Input type="number" min={0} step="0.5" value={f.hourly_rate} onChange={(e) => set("hourly_rate", Number(e.target.value))} /></F>
        </div>
        <F label="Approximate area">
          <div className="flex gap-2">
            <Select value={AREAS.some((a) => a.name === f.area_name) ? f.area_name : undefined} onValueChange={(v) => { const a = AREAS.find((x) => x.name === v)!; setF((x) => ({ ...x, area_name: a.name, lat: a.lat, lng: a.lng })); }}>
              <SelectTrigger><SelectValue placeholder={f.area_name || "Choose an area"} /></SelectTrigger>
              <SelectContent>{AREAS.map((a) => <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={locate}><LocateFixed /> Near me</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">We store this rounded to about 1 km. Never your home address.</p>
        </F>
        <F label={`Travel radius: ${f.travel_radius_km} km`}>
          <input type="range" min={1} max={30} value={f.travel_radius_km} onChange={(e) => set("travel_radius_km", Number(e.target.value))} className="w-full accent-honey" />
        </F>
        <div className="grid grid-cols-2 gap-4">
          <F label="Available from (optional)"><Input type="datetime-local" value={f.available_from} onChange={(e) => set("available_from", e.target.value)} /></F>
          <F label="Available until (optional)"><Input type="datetime-local" value={f.available_until} onChange={(e) => set("available_until", e.target.value)} /></F>
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Save profile</Button>
      </div>
    </form>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function Skeletons() {
  return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted" />)}</div>;
}

function PageLoading() {
  return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-honey" /></div>;
}
