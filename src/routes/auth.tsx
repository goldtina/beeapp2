import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, ChefHat, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ensureDemoAccount } from "@/lib/demo.functions";
import { errMsg } from "@/lib/format";
import type { Role } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { as?: Role } => ({
    as: s.as === "worker" || s.as === "business" ? s.as : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Bee Ready Agency" },
      { name: "description", content: "Sign in or join Bee Ready Agency as a hospitality worker or business." },
      { property: "og:title", content: "Sign in — Bee Ready Agency" },
      { property: "og:description", content: "Join as a worker or business, or try the one-click demo accounts." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { as } = Route.useSearch();
  const navigate = useNavigate();
  const demo = useServerFn(ensureDemoAccount);
  const [role, setRole] = useState<Role>(as ?? "worker");
  const [busy, setBusy] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    if (as) sessionStorage.setItem("bee-intended-role", as);
  }, [as]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy("signin");
    const { error } = await supabase.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    setBusy(null);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy("signup");
    sessionStorage.setItem("bee-intended-role", role);
    const { data, error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: String(f.get("name")), intended_role: role } },
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    if (data.session) navigate({ to: "/dashboard" });
    else setCheckEmail(true);
  }

  async function google() {
    sessionStorage.setItem("bee-intended-role", role);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(errMsg(r.error));
    else if (!r.redirected) navigate({ to: "/dashboard" });
  }

  async function tryDemo(kind: Role) {
    setBusy(kind);
    try {
      const { email, password } = await demo({ data: { kind } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: kind === "worker" ? "/worker" : "/business" });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="honeycomb hidden flex-col justify-between bg-charcoal p-12 text-charcoal-foreground lg:flex">
        <Link to="/"><Logo inverted /></Link>
        <div>
          <h1 className="text-5xl font-semibold leading-tight">The Right Staff,<br /><span className="text-honey">Right When You Need Them.</span></h1>
          <p className="mt-4 max-w-md text-charcoal-foreground/70">Pubs, restaurants, bars, cafés and hotels fill short-notice shifts with ready-to-work professionals.</p>
        </div>
        <p className="text-xs text-charcoal-foreground/50">MLH Hack for Humanity · 2026</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden"><Logo /></Link>

          <div className="mt-8 rounded-3xl border-2 border-dashed border-honey bg-honey-soft/60 p-5">
            <p className="text-xs font-bold uppercase tracking-widest">Demo mode · for judges</p>
            <p className="mt-1 text-sm text-muted-foreground">One click signs you into a fictional, pre-filled account.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="dark" onClick={() => tryDemo("worker")} disabled={!!busy}>
                {busy === "worker" ? <Loader2 className="animate-spin" /> : <ChefHat />} Worker: Maya
              </Button>
              <Button variant="hero" onClick={() => tryDemo("business")} disabled={!!busy}>
                {busy === "business" ? <Loader2 className="animate-spin" /> : <Briefcase />} Harbour Pub
              </Button>
            </div>
          </div>

          {checkEmail ? (
            <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
              <h2 className="text-2xl font-semibold">Check your email</h2>
              <p className="mt-2 text-muted-foreground">We've sent a confirmation link. Open it to finish creating your account.</p>
            </div>
          ) : (
            <Tabs defaultValue={as ? "signup" : "signin"} className="mt-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="mt-4 space-y-4">
                  <Field label="Email" name="email" type="email" />
                  <Field label="Password" name="password" type="password" />
                  <Button type="submit" variant="hero" className="w-full" disabled={!!busy}>
                    {busy === "signin" && <Loader2 className="animate-spin" />} Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {(["worker", "business"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "rounded-2xl border-2 p-4 text-left transition-all",
                        role === r ? "border-honey bg-honey-soft shadow-honey" : "border-border bg-card hover:border-honey/50",
                      )}
                    >
                      {r === "worker" ? <ChefHat className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                      <p className="mt-2 font-semibold">{r === "worker" ? "I'm Ready to Work" : "I Need Staff"}</p>
                      <p className="text-xs text-muted-foreground">{r === "worker" ? "Find flexible shifts" : "Pub, bar, café, hotel…"}</p>
                    </button>
                  ))}
                </div>
                <form onSubmit={signUp} className="mt-4 space-y-4">
                  <Field label={role === "worker" ? "Full name" : "Business name"} name="name" />
                  <Field label="Email" name="email" type="email" />
                  <Field label="Password" name="password" type="password" minLength={8} />
                  <Button type="submit" variant="hero" className="w-full" disabled={!!busy}>
                    {busy === "signup" && <Loader2 className="animate-spin" />} Create {role} account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full rounded-full" onClick={google}>Continue with Google</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", minLength }: { label: string; name: string; type?: string; minLength?: number }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required minLength={minLength} className="h-11 rounded-xl bg-card" />
    </div>
  );
}
