import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Check, Clock, Loader2, MapPin, Plus, Siren, Star, Users, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MapView } from "@/components/MapView";
import { DemoBadge, Empty, ErrorBox, ScorePill, StatCard, StatusBadge } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { beeMatch } from "@/lib/bee-match";
import { AREAS, BUSINESS_TYPES, DEFAULT_CENTER, HOSPITALITY_ROLES, SKILLS } from "@/lib/constants";
import { ChipPicker } from "@/components/dash";
import { errMsg, gbp, shiftHours, shiftWhen } from "@/lib/format";
import { fetchBusiness, fetchBusinessShifts, fetchReadyWorkers, type BizShift, type BusinessProfile, type WorkerProfile } from "@/lib/queries";
import { useMe } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/business")({
  head: () => ({ meta: [{ title: "Business dashboard — Bee Ready Agency" }, { name: "description", content: "Post shifts, discover workers and confirm bookings." }] }),
  component: BusinessDashboard,
});

function BusinessDashboard() {
  const uid = Route.useRouteContext().user.id;
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("shifts");

  useEffect(() => {
    if (me.data && me.data.role !== "business") navigate({ to: "/dashboard", replace: true });
  }, [me.data, navigate]);

  const biz = useQuery({ queryKey: ["business", uid], queryFn: () => fetchBusiness(uid) });
  const shifts = useQuery({ queryKey: ["biz-shifts", uid], queryFn: () => fetchBusinessShifts(uid) });
  const workers = useQuery({ queryKey: ["ready-workers"], queryFn: fetchReadyWorkers });

  useEffect(() => {
    const ch = supabase
      .channel(`biz-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => qc.invalidateQueries({ queryKey: ["biz-shifts", uid] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, qc]);

  if (biz.isLoading) return <PageLoading />;
  if (biz.error) return <div className="p-8"><ErrorBox error={biz.error} /></div>;
  const b = biz.data;
  if (!b) return <PageLoading />;

  const all = shifts.data ?? [];
  const active = all.filter((s) => (s.status === "open" || s.status === "filled") && new Date(s.ends_at) > new Date(Date.now() - 12 * 36e5));
  const history = all.filter((s) => !active.includes(s)).reverse();
  const pendingApps = active.flatMap((s) => s.applications.filter((a) => a.status === "applied")).length;
  const confirmedCount = active.flatMap((s) => s.applications.filter((a) => a.status === "confirmed")).length;
  const profileIncomplete = b.lat == null || !b.name;

  return (
    <div className="min-h-screen pb-20">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2"><p className="text-sm text-muted-foreground">Business dashboard</p>{b.is_demo && <DemoBadge />}</div>
            <h1 className="mt-1 text-4xl font-semibold">{b.name || "Your business"}</h1>
            <p className="text-muted-foreground">{b.business_type}{b.area_name && ` · ${b.area_name}`}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="sos" size="lg" className="rounded-full animate-pulse-sos" onClick={() => setTab("sos")}><Siren /> Bee SOS</Button>
            <Button variant="dark" size="lg" onClick={() => setTab("post")}><Plus /> Post shift</Button>
          </div>
        </div>

        {profileIncomplete && (
          <div className="mt-6 rounded-2xl border border-honey bg-honey-soft p-4 text-sm">Set your business location in the Profile tab before posting shifts.</div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Active shifts" value={active.length} icon={<CalendarClock className="h-4 w-4" />} />
          <StatCard label="New applications" value={pendingApps} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Confirmed staff" value={confirmedCount} icon={<Check className="h-4 w-4" />} />
          <StatCard label="Workers ready now" value={workers.data?.length ?? "—"} icon={<Star className="h-4 w-4" />} />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList className="flex-wrap rounded-full">
            <TabsTrigger value="shifts" className="rounded-full">Upcoming shifts</TabsTrigger>
            <TabsTrigger value="post" className="rounded-full">Post shift</TabsTrigger>
            <TabsTrigger value="sos" className="rounded-full">Bee SOS</TabsTrigger>
            <TabsTrigger value="discover" className="rounded-full">Discover workers</TabsTrigger>
            <TabsTrigger value="history" className="rounded-full">History</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="shifts" className="mt-6 space-y-5">
            {shifts.isLoading && <div className="h-40 animate-pulse rounded-3xl bg-muted" />}
            {shifts.error && <ErrorBox error={shifts.error} />}
            {shifts.data && active.length === 0 && <Empty title="No active shifts" body="Post a shift or send a Bee SOS to start receiving applications." action={<Button variant="hero" onClick={() => setTab("post")}>Post a shift</Button>} />}
            {active.map((s) => <ShiftManager key={s.id} shift={s} workers={workers.data ?? []} />)}
          </TabsContent>

          <TabsContent value="post" className="mt-6"><ShiftForm biz={b} onDone={() => setTab("shifts")} /></TabsContent>
          <TabsContent value="sos" className="mt-6"><ShiftForm biz={b} urgent onDone={() => setTab("shifts")} /></TabsContent>

          <TabsContent value="discover" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
              <div className="grid gap-3 sm:grid-cols-2">
                {workers.isLoading && <div className="h-32 animate-pulse rounded-3xl bg-muted" />}
                {workers.data?.length === 0 && <Empty title="No one is Ready to Work right now" />}
                {workers.data?.map((w) => <WorkerCard key={w.user_id} w={w} />)}
              </div>
              <div className="lg:sticky lg:top-24 lg:self-start">
                <MapView height={480} center={b.lat != null ? { lat: b.lat, lng: b.lng! } : DEFAULT_CENTER}
                  points={[
                    ...(b.lat != null ? [{ id: "biz", lat: b.lat, lng: b.lng!, kind: "shift" as const, label: b.name }] : []),
                    ...(workers.data ?? []).filter((w) => w.lat != null).map((w) => ({ id: w.user_id, lat: w.lat!, lng: w.lng!, kind: "worker" as const, label: `${w.full_name} · approx. ${w.area_name}` })),
                  ]} />
                <p className="mt-2 text-xs text-muted-foreground">Worker locations are approximate areas (~1 km), never home addresses.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-3">
            {history.length === 0 && <Empty title="No staffing history yet" />}
            {history.map((s) => (
              <div key={s.id} className="flex flex-col justify-between gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2"><StatusBadge status={s.status} />{s.is_demo && <DemoBadge />}</div>
                  <p className="mt-1 font-semibold">{s.workers_needed} × {s.role}</p>
                  <p className="text-sm text-muted-foreground">{shiftWhen(s.starts_at, s.ends_at)} · {gbp(Number(s.hourly_rate))}/h</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {s.applications.filter((a) => a.status === "completed" || a.status === "confirmed").map((a) => a.worker?.full_name).join(", ") || "No staff booked"}
                </p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="profile" className="mt-6"><BusinessProfileForm b={b} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ShiftManager({ shift: s, workers }: { shift: BizShift; workers: WorkerProfile[] }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const invalidate = () => qc.invalidateQueries();
  const respond = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase.rpc("respond_to_application", { _app_id: id, _accept: accept });
      if (error) throw error;
    },
    onSuccess: (_, v) => { invalidate(); toast.success(v.accept ? "Shift confirmed! The worker can see it on their dashboard." : "Application declined."); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const offer = useMutation({
    mutationFn: async ({ worker, score }: { worker: string; score: number }) => {
      const { error } = await supabase.rpc("offer_shift", { _shift_id: s.id, _worker_id: worker, _match_score: score });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Offer sent. The worker will see it instantly."); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const complete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("complete_shift", { _shift_id: s.id, _rating: rating });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Shift completed and staff rated."); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shifts").update({ status: "cancelled" }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Shift cancelled."); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const linked = new Set(s.applications.map((a) => a.worker_id));
  const candidates = useMemo(
    () => workers.filter((w) => !linked.has(w.user_id)).map((w) => ({ w, m: beeMatch(w, s) })).filter((x) => x.m.score >= 50).sort((a, b) => b.m.score - a.m.score).slice(0, 4),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workers, s],
  );
  const applied = s.applications.filter((a) => a.status === "applied").map((a) => ({ a, m: beeMatch(a.worker, s) })).sort((x, y) => y.m.score - x.m.score);
  const confirmed = s.applications.filter((a) => a.status === "confirmed");
  const offered = s.applications.filter((a) => a.status === "offered");
  const started = new Date(s.starts_at) < new Date();

  return (
    <div className={`rounded-3xl border bg-card p-6 shadow-soft ${s.is_urgent ? "border-sos/50" : "border-border"}`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {s.is_urgent && <span className="rounded-full bg-sos px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sos-foreground">Bee SOS</span>}
            <StatusBadge status={s.status} />{s.is_demo && <DemoBadge />}
          </div>
          <h3 className="mt-2 text-xl font-semibold">{s.workers_needed} × {s.role}{s.title && <span className="font-normal text-muted-foreground"> — {s.title}</span>}</h3>
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{shiftWhen(s.starts_at, s.ends_at)}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.location_name}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold">{gbp(Number(s.hourly_rate))}<span className="text-xs text-muted-foreground">/h</span></p>
          <p className="text-sm text-muted-foreground">{confirmed.length}/{s.workers_needed} confirmed</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Col title={`Applications (${applied.length})`}>
          {applied.length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}
          {applied.map(({ a, m }) => (
            <PersonRow key={a.id} w={a.worker} sub={m.summary} score={m.score}>
              <Button size="sm" variant="success" disabled={respond.isPending || s.status !== "open"} onClick={() => respond.mutate({ id: a.id, accept: true })}><Check /> Accept</Button>
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={respond.isPending} onClick={() => respond.mutate({ id: a.id, accept: false })} aria-label="Decline"><X /></Button>
            </PersonRow>
          ))}
        </Col>
        <Col title="Bee Match suggestions">
          {s.status !== "open" ? <p className="text-sm text-muted-foreground">Shift is fully staffed.</p> : candidates.length === 0 ? <p className="text-sm text-muted-foreground">No strong matches available right now.</p> : null}
          {s.status === "open" && candidates.map(({ w, m }) => (
            <PersonRow key={w.user_id} w={w} sub={m.summary} score={m.score}>
              <Button size="sm" variant="hero" disabled={offer.isPending} onClick={() => offer.mutate({ worker: w.user_id, score: m.score })}>Offer</Button>
            </PersonRow>
          ))}
          {offered.map((a) => <PersonRow key={a.id} w={a.worker} sub="Offer sent — awaiting reply"><StatusBadge status="offered" /></PersonRow>)}
        </Col>
        <Col title="Confirmed team">
          {confirmed.length === 0 && <p className="text-sm text-muted-foreground">Nobody confirmed yet.</p>}
          {confirmed.map((a) => <PersonRow key={a.id} w={a.worker} sub={`Est. cost ${gbp(shiftHours(s.starts_at, s.ends_at) * Number(s.hourly_rate))}`}><StatusBadge status="confirmed" /></PersonRow>)}
        </Col>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        {confirmed.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rate staff</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}><Star className={`h-5 w-5 ${n <= rating ? "fill-honey text-honey" : "text-border"}`} /></button>
            ))}
            <Button size="sm" variant="dark" disabled={complete.isPending} onClick={() => complete.mutate()} title={started ? "" : "Demo: you can complete early to test the flow"}>Mark completed</Button>
          </div>
        )}
        <Button size="sm" variant="ghost" disabled={cancel.isPending} onClick={() => cancel.mutate()}>Cancel shift</Button>
      </div>
    </div>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2 rounded-2xl bg-muted/60 p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>{children}</div>;
}

function PersonRow({ w, sub, score, children }: { w: WorkerProfile; sub: string; score?: number; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{w.full_name} <span className="font-normal text-muted-foreground">· ★ {w.rating}</span></p>
          {score != null && <ScorePill score={score} />}
        </div>
        <div className="flex shrink-0 gap-1.5">{children}</div>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function WorkerCard({ w }: { w: WorkerProfile }) {
  return (
    <div className="card-hover rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-honey font-display font-semibold">{w.full_name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
        <div><p className="font-semibold">{w.full_name}</p><p className="text-xs text-muted-foreground">{w.headline}</p></div>
      </div>
      <p className="mt-3 text-sm">{w.roles.join(" · ")}</p>
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>~{w.area_name} · {w.travel_radius_km} km</span>
        <span>{w.experience_years} yrs · {gbp(Number(w.hourly_rate))}/h · ★ {w.rating}</span>
      </div>
    </div>
  );
}

function ShiftForm({ biz, urgent, onDone }: { biz: BusinessProfile; urgent?: boolean; onDone: () => void }) {
  const qc = useQueryClient();
  const today = new Date();
  const ymd = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const [f, setF] = useState({
    role: "Bartender", title: "", description: "", required_skills: [] as string[], min_experience_years: 1,
    date: ymd, start: "18:00", end: "23:00", hourly_rate: 16, workers_needed: urgent ? 2 : 1, is_urgent: !!urgent,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const post = useMutation({
    mutationFn: async () => {
      if (biz.lat == null) throw new Error("Set your business location in Profile first");
      const starts = new Date(`${f.date}T${f.start}`);
      const ends = new Date(`${f.date}T${f.end}`);
      if (ends <= starts) ends.setDate(ends.getDate() + 1); // overnight shift
      const { error } = await supabase.from("shifts").insert({
        business_id: biz.user_id, role: f.role, title: f.title, description: f.description, required_skills: f.required_skills,
        min_experience_years: f.min_experience_years, starts_at: starts.toISOString(), ends_at: ends.toISOString(),
        hourly_rate: f.hourly_rate, workers_needed: f.workers_needed, is_urgent: f.is_urgent,
        location_name: `${biz.name}${biz.area_name ? `, ${biz.area_name}` : ""}`, lat: biz.lat, lng: biz.lng!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success(f.is_urgent ? "Bee SOS sent! Matching workers are being alerted now." : "Shift posted.");
      onDone();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const preview = `${biz.name || "Your business"} needs ${f.workers_needed} ${f.role.toLowerCase()}${f.workers_needed > 1 ? "s" : ""} ${f.date === ymd ? "tonight" : f.date}, ${f.start}–${f.end}, £${f.hourly_rate}/hour.`;

  return (
    <form onSubmit={(e) => { e.preventDefault(); post.mutate(); }} className={`grid gap-6 rounded-3xl border-2 bg-card p-6 shadow-soft lg:grid-cols-2 ${f.is_urgent ? "border-sos" : "border-border"}`}>
      <div className="space-y-4">
        {urgent && <div className="flex items-center gap-2 font-semibold text-sos"><Siren /> Emergency staffing request</div>}
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Role">
            <Select value={f.role} onValueChange={(v) => set("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{HOSPITALITY_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Fld>
          <Fld label="Workers needed"><Input type="number" min={1} max={50} value={f.workers_needed} onChange={(e) => set("workers_needed", Number(e.target.value))} /></Fld>
        </div>
        <Fld label="Title (optional)"><Input value={f.title} placeholder="e.g. Friday cocktail rush" onChange={(e) => set("title", e.target.value)} /></Fld>
        <Fld label="Details"><Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Fld>
        <Fld label="Required skills"><ChipPicker options={SKILLS} value={f.required_skills} onChange={(v) => set("required_skills", v)} /></Fld>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Fld label="Date"><Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} required /></Fld>
          <Fld label="Start"><Input type="time" value={f.start} onChange={(e) => set("start", e.target.value)} required /></Fld>
          <Fld label="End"><Input type="time" value={f.end} onChange={(e) => set("end", e.target.value)} required /></Fld>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Pay (£/hour)"><Input type="number" min={1} step="0.5" value={f.hourly_rate} onChange={(e) => set("hourly_rate", Number(e.target.value))} /></Fld>
          <Fld label="Min. experience (yrs)"><Input type="number" min={0} value={f.min_experience_years} onChange={(e) => set("min_experience_years", Number(e.target.value))} /></Fld>
        </div>
        <label className="flex items-center justify-between rounded-2xl border border-border p-4">
          <span><span className="flex items-center gap-1.5 font-semibold"><Siren className="h-4 w-4 text-sos" /> Bee SOS</span><span className="text-xs text-muted-foreground">Alert suitable Ready-to-Work staff instantly</span></span>
          <Switch checked={f.is_urgent} onCheckedChange={(v) => set("is_urgent", v)} />
        </label>
        <div className="rounded-2xl bg-muted p-4 text-sm"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview</span><p className="mt-1 font-medium">{preview}</p></div>
        <Button type="submit" variant={f.is_urgent ? "sos" : "hero"} size="lg" className="w-full rounded-full" disabled={post.isPending}>
          {post.isPending && <Loader2 className="animate-spin" />} {f.is_urgent ? "Send Bee SOS" : "Post shift"}
        </Button>
      </div>
    </form>
  );
}

function BusinessProfileForm({ b }: { b: BusinessProfile }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: b.name, business_type: b.business_type, description: b.description, address: b.address, area_name: b.area_name, lat: b.lat, lng: b.lng });
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("business_profiles").update(f).eq("user_id", b.user_id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["business", b.user_id] }); toast.success("Business profile saved"); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid max-w-3xl gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:grid-cols-2">
      <Fld label="Business name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Fld>
      <Fld label="Type">
        <Select value={f.business_type} onValueChange={(v) => setF({ ...f, business_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </Fld>
      <Fld label="Street / venue address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Fld>
      <Fld label="Area (sets map location)">
        <Select value={AREAS.some((a) => a.name === f.area_name) ? f.area_name : undefined} onValueChange={(v) => { const a = AREAS.find((x) => x.name === v)!; setF({ ...f, area_name: a.name, lat: a.lat, lng: a.lng }); }}>
          <SelectTrigger><SelectValue placeholder={f.area_name || "Choose an area"} /></SelectTrigger>
          <SelectContent>{AREAS.map((a) => <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </Fld>
      <div className="sm:col-span-2"><Fld label="About"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Fld></div>
      <Button type="submit" variant="hero" size="lg" className="sm:col-span-2" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Save profile</Button>
    </form>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function PageLoading() {
  return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-honey" /></div>;
}
