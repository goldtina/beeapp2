/**
 * Bee Match — a transparent, rule-based scoring system (NOT a trained AI model).
 * Every point awarded is explained so workers and businesses can see why a match was made.
 *
 * Weights (total 100):
 *   Role 30 · Skills 15 · Distance 20 · Experience 15 · Pay vs. preferred rate 10 · Availability & timing 10
 */

export interface MatchWorker {
  roles: string[];
  skills: string[];
  experience_years: number;
  hourly_rate: number;
  lat: number | null;
  lng: number | null;
  travel_radius_km: number;
  ready_to_work: boolean;
  available_from?: string | null;
  available_until?: string | null;
}

export interface MatchShift {
  role: string;
  required_skills: string[];
  min_experience_years: number;
  hourly_rate: number;
  lat: number;
  lng: number;
  starts_at: string;
  ends_at: string;
}

export interface MatchFactor {
  label: string;
  points: number;
  max: number;
  note: string;
}

export interface MatchResult {
  score: number;
  distanceKm: number | null;
  factors: MatchFactor[];
  summary: string;
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function timingLabel(startIso: string, now: Date): string {
  const start = new Date(startIso);
  const sameDay = start.toDateString() === now.toDateString();
  if (sameDay) return start.getHours() >= 17 ? "available tonight" : "available today";
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (start.toDateString() === tomorrow.toDateString()) return "available tomorrow";
  return "available for this shift";
}

export function beeMatch(w: MatchWorker, s: MatchShift, now: Date = new Date()): MatchResult {
  const factors: MatchFactor[] = [];
  const highlights: string[] = [];

  // Role (30)
  const roleOk = w.roles.map((r) => r.toLowerCase()).includes(s.role.toLowerCase());
  factors.push({ label: "Role", max: 30, points: roleOk ? 30 : 0, note: roleOk ? `Works as ${s.role}` : `Doesn't list ${s.role}` });

  // Skills (15)
  const have = new Set(w.skills.map((x) => x.toLowerCase()));
  const req = s.required_skills;
  const matched = req.filter((r) => have.has(r.toLowerCase()));
  const skillPts = req.length === 0 ? 15 : Math.round((15 * matched.length) / req.length);
  factors.push({
    label: "Skills",
    max: 15,
    points: skillPts,
    note: req.length === 0 ? "No specific skills required" : `${matched.length}/${req.length} required skills`,
  });

  // Experience (15)
  const expPts =
    w.experience_years >= s.min_experience_years
      ? 15
      : Math.round((15 * w.experience_years) / Math.max(1, s.min_experience_years));
  factors.push({ label: "Experience", max: 15, points: expPts, note: `${w.experience_years} yrs (needs ${s.min_experience_years}+)` });

  // Distance (20)
  let dist: number | null = null;
  let distPts = 0;
  let distNote = "Location not set";
  if (w.lat != null && w.lng != null) {
    dist = distanceKm(w.lat, w.lng, s.lat, s.lng);
    if (dist <= w.travel_radius_km) {
      distPts = Math.round(20 * (1 - (dist / w.travel_radius_km) * 0.5));
      distNote = `~${dist.toFixed(1)} km, within ${w.travel_radius_km} km radius`;
    } else {
      distNote = `~${dist.toFixed(1)} km, outside ${w.travel_radius_km} km radius`;
    }
  }
  factors.push({ label: "Distance", max: 20, points: distPts, note: distNote });

  // Pay (10)
  const payPts =
    s.hourly_rate >= w.hourly_rate ? 10 : Math.max(0, Math.round(10 - (w.hourly_rate - s.hourly_rate) * 4));
  factors.push({
    label: "Pay",
    max: 10,
    points: payPts,
    note: `£${s.hourly_rate}/h vs preferred £${w.hourly_rate}/h`,
  });

  // Availability & timing (10)
  let availPts = 0;
  let availNote = "Not marked Ready to Work";
  if (w.ready_to_work) {
    const from = w.available_from ? new Date(w.available_from).getTime() : null;
    const until = w.available_until ? new Date(w.available_until).getTime() : null;
    const st = new Date(s.starts_at).getTime();
    const en = new Date(s.ends_at).getTime();
    const covers = (from == null || from <= st) && (until == null || until >= en);
    availPts = covers ? 10 : 5;
    availNote = covers ? "Ready to Work for this time" : "Ready, but availability window only partly overlaps";
  }
  factors.push({ label: "Availability", max: 10, points: availPts, note: availNote });

  const score = factors.reduce((a, f) => a + f.points, 0);

  if (roleOk) highlights.push(w.experience_years >= 3 ? `Experienced ${s.role.toLowerCase()}` : `${s.role} match`);
  if (availPts === 10) highlights.push(timingLabel(s.starts_at, now));
  if (distPts > 0) highlights.push("within travel radius");
  if (payPts === 10) highlights.push("pay meets preferred rate");
  const summary = `${score}% Match — ${highlights.length ? highlights.join(", ") : "partial fit"}`;

  return { score, distanceKm: dist, factors, summary: summary.replace(/, ([^,]*)$/, ", $1") };
}
