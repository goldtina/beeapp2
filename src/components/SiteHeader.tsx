import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";

export function SiteHeader() {
  const { data } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const dash = data?.role === "business" ? "/business" : data?.role === "worker" ? "/worker" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Bee Ready Agency home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          {data?.user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to={dash}>My dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut /> <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="dark" size="sm">
                <Link to="/auth" search={{ as: "business" }}>Get staff</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-charcoal text-charcoal-foreground">
      <div className="honeycomb">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo inverted />
            <p className="mt-4 max-w-sm text-sm text-charcoal-foreground/70">
              The Right Staff, Right When You Need Them. Connecting hospitality businesses with reliable, ready-to-work professionals.
            </p>
          </div>
          <div>
            <h4 className="font-display text-honey">For businesses</h4>
            <ul className="mt-3 space-y-2 text-sm text-charcoal-foreground/70">
              <li><Link to="/auth" search={{ as: "business" }} className="hover:text-honey">Post a shift</Link></li>
              <li><Link to="/auth" search={{ as: "business" }} className="hover:text-honey">Bee SOS</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-honey">For workers</h4>
            <ul className="mt-3 space-y-2 text-sm text-charcoal-foreground/70">
              <li><Link to="/auth" search={{ as: "worker" }} className="hover:text-honey">Join as a worker</Link></li>
              <li><Link to="/auth" search={{ as: "worker" }} className="hover:text-honey">Find shifts</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-charcoal-foreground/10">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-6 py-5 text-xs text-charcoal-foreground/50 sm:flex-row">
            <span>© 2026 Bee Ready Agency · Built for MLH Hack for Humanity</span>
            <span>Demo data is fictional. Worker locations are shown approximately.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
