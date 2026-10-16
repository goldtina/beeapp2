import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * DEMO ONLY: ensures the two public judge accounts exist (fixed IDs that match the
 * seeded demo profiles) and rolls demo shift times forward so "tonight" stays tonight.
 * Credentials are intentionally public and only unlock fictional demo records.
 */
export const DEMO_ACCOUNTS = {
  worker: { id: "00000000-0000-4000-a000-000000000001", email: "maya@demo.beeready.app", name: "Maya Okafor" },
  business: { id: "00000000-0000-4000-b000-000000000001", email: "harbour@demo.beeready.app", name: "The Harbour Pub" },
} as const;
export const DEMO_PASSWORD = "BeeReady-Demo-2026!";

export const ensureDemoAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ kind: z.enum(["worker", "business"]) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const acct = DEMO_ACCOUNTS[data.kind];

    const { data: existing } = await supabaseAdmin.auth.admin.getUserById(acct.id);
    if (!existing?.user) {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        id: acct.id,
        email: acct.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: acct.name, demo: true },
      } as Parameters<typeof supabaseAdmin.auth.admin.createUser>[0] & { id: string });
      if (error) throw new Error(`Could not create demo account: ${error.message}`);
    }
    await supabaseAdmin.from("user_roles").upsert({ user_id: acct.id, role: data.kind }, { onConflict: "user_id" });
    await supabaseAdmin.rpc("roll_demo_shifts");
    return { email: acct.email, password: DEMO_PASSWORD };
  });
