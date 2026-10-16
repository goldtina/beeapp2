import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type WorkerProfile = Database["public"]["Tables"]["worker_profiles"]["Row"];
export type BusinessProfile = Database["public"]["Tables"]["business_profiles"]["Row"];
export type Shift = Database["public"]["Tables"]["shifts"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];

export type ShiftWithBusiness = Shift & { business: Pick<BusinessProfile, "name" | "business_type"> | null };

const SHIFT_SELECT = "*, business:business_profiles(name, business_type)";

export async function fetchOpenShifts(): Promise<ShiftWithBusiness[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select(SHIFT_SELECT)
    .eq("status", "open")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw error;
  return data as ShiftWithBusiness[];
}

export async function fetchWorker(uid: string) {
  const { data, error } = await supabase.from("worker_profiles").select("*").eq("user_id", uid).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchBusiness(uid: string) {
  const { data, error } = await supabase.from("business_profiles").select("*").eq("user_id", uid).maybeSingle();
  if (error) throw error;
  return data;
}

export type MyApplication = Application & { shift: ShiftWithBusiness };
export async function fetchMyApplications(uid: string): Promise<MyApplication[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(`*, shift:shifts(${SHIFT_SELECT})`)
    .eq("worker_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as MyApplication[];
}

export type BizApplication = Application & { worker: WorkerProfile };
export type BizShift = Shift & { applications: BizApplication[] };
export async function fetchBusinessShifts(uid: string): Promise<BizShift[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*, applications(*, worker:worker_profiles(*))")
    .eq("business_id", uid)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data as unknown as BizShift[];
}

export async function fetchReadyWorkers() {
  const { data, error } = await supabase.from("worker_profiles").select("*").eq("ready_to_work", true).order("rating", { ascending: false });
  if (error) throw error;
  return data;
}
