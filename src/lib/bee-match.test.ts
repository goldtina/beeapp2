import { describe, expect, it } from "vitest";
import { beeMatch, distanceKm } from "./bee-match";

const now = new Date("2026-10-16T12:00:00");
const shift = {
  role: "Bartender",
  required_skills: ["Cocktails"],
  min_experience_years: 2,
  hourly_rate: 16,
  lat: 51.5046,
  lng: -0.056,
  starts_at: "2026-10-16T18:00:00",
  ends_at: "2026-10-16T23:00:00",
};
const worker = {
  roles: ["Bartender"],
  skills: ["Cocktails"],
  experience_years: 5,
  hourly_rate: 15,
  lat: 51.5046,
  lng: -0.056,
  travel_radius_km: 8,
  ready_to_work: true,
};

describe("Bee Match", () => {
  it("gives a perfect, nearby, available bartender 100%", () => {
    const r = beeMatch(worker, shift, now);
    expect(r.score).toBe(100);
    expect(r.summary).toContain("available tonight");
  });
  it("awards no role points when the role does not match", () => {
    const r = beeMatch({ ...worker, roles: ["Chef"] }, shift, now);
    expect(r.factors.find((f) => f.label === "Role")?.points).toBe(0);
    expect(r.score).toBe(70);
  });
  it("awards no distance points outside the travel radius", () => {
    const r = beeMatch({ ...worker, lat: 51.6, lng: -0.3, travel_radius_km: 5 }, shift, now);
    expect(r.factors.find((f) => f.label === "Distance")?.points).toBe(0);
  });
  it("gives no availability points when not Ready to Work", () => {
    const r = beeMatch({ ...worker, ready_to_work: false }, shift, now);
    expect(r.factors.find((f) => f.label === "Availability")?.points).toBe(0);
  });
  it("measures distance with haversine", () => {
    expect(distanceKm(51.5, 0, 51.5, 0)).toBe(0);
    expect(distanceKm(51.5, 0, 51.6, 0)).toBeCloseTo(11.1, 0);
  });
});
