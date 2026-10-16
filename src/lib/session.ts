import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "worker" | "business";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return { user: null, role: null as Role | null };
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    return { user, role: (r?.role ?? null) as Role | null };
  },
  staleTime: 30_000,
});

export function useMe() {
  return useQuery(meQuery);
}
