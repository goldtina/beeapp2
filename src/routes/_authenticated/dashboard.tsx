import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, ChefHat, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useMe, type Role } from "@/lib/session";
import { errMsg } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your dashboard — Bee Ready Agency" }, { name: "description", content: "Choose how you use Bee Ready." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>("worker");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.role) navigate({ to: data.role === "worker" ? "/worker" : "/business", replace: true });
  }, [data?.role, navigate]);

  useEffect(() => {
    const meta = data?.user?.user_metadata ?? {};
    const intended = sessionStorage.getItem("bee-intended-role") ?? meta.intended_role;
    if (intended === "worker" || intended === "business") setRole(intended);
    if (meta.full_name) setName(String(meta.full_name));
  }, [data?.user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("set_my_role", { _role: role, _name: name });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    sessionStorage.removeItem("bee-intended-role");
    await qc.invalidateQueries({ queryKey: ["me"] });
  }

  if (isLoading || data?.role)
    return (
      <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-honey" /></div>
    );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="honeycomb">
        <form onSubmit={submit} className="mx-auto max-w-xl px-4 py-16">
          <h1 className="text-4xl font-semibold">Welcome to the hive</h1>
          <p className="mt-2 text-muted-foreground">How will you use Bee Ready? This can't be changed later.</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {(["worker", "business"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={cn("rounded-3xl border-2 bg-card p-6 text-left transition-all", role === r ? "border-honey shadow-honey" : "border-border hover:border-honey/50")}>
                {r === "worker" ? <ChefHat /> : <Briefcase />}
                <p className="mt-3 text-lg font-semibold">{r === "worker" ? "I'm Ready to Work" : "I Need Staff"}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-1.5">
            <Label htmlFor="name">{role === "worker" ? "Your full name" : "Business name"}</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl bg-card" />
          </div>
          <Button type="submit" variant="hero" size="xl" className="mt-6 w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
