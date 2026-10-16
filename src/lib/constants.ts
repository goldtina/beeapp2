export const HOSPITALITY_ROLES = [
  "Bartender",
  "Barback",
  "Waiter",
  "Host",
  "Chef",
  "Kitchen Porter",
  "Barista",
  "Housekeeping",
  "Event Staff",
] as const;

export const SKILLS = [
  "Cocktails",
  "Wine service",
  "Cash handling",
  "Personal licence",
  "Cellar management",
  "Glass collection",
  "Silver service",
  "Allergen awareness",
  "Food hygiene L2",
  "Grill",
  "Prep",
  "Latte art",
  "Room inspection",
  "Team lead",
  "Deep cleaning",
] as const;

export const BUSINESS_TYPES = ["Pub", "Restaurant", "Bar", "Café", "Hotel", "Events"] as const;

/** Approximate neighbourhood centres — we never store exact home addresses for workers. */
export const AREAS: { name: string; lat: number; lng: number }[] = [
  { name: "Main Street", lat: 36.1405, lng: -5.353 },
  { name: "Casemates Square", lat: 36.1447, lng: -5.354 },
  { name: "Ocean Village", lat: 36.1475, lng: -5.358 },
  { name: "Marina Bay", lat: 36.148, lng: -5.3565 },
  { name: "Queensway Quay", lat: 36.1395, lng: -5.356 },
  { name: "Westside", lat: 36.134, lng: -5.357 },
  { name: "Town Range", lat: 36.139, lng: -5.3525 },
  { name: "Upper Town", lat: 36.143, lng: -5.3505 },
  { name: "Glacis", lat: 36.1495, lng: -5.351 },
  { name: "Catalan Bay", lat: 36.144, lng: -5.342 },
  { name: "South District", lat: 36.125, lng: -5.348 },
  { name: "Europa Point", lat: 36.11, lng: -5.346 },
];

/** Gibraltar, GX11 1AA */
export const DEFAULT_CENTER = { lat: 36.1408, lng: -5.3536 };
export const LOCATION_LABEL = "Gibraltar, GX11 1AA";
