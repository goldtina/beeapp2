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
  { name: "Wapping", lat: 51.5046, lng: -0.056 },
  { name: "Shadwell", lat: 51.511, lng: -0.0567 },
  { name: "Bermondsey", lat: 51.4979, lng: -0.0637 },
  { name: "Borough", lat: 51.5011, lng: -0.0943 },
  { name: "Tower Hill", lat: 51.5098, lng: -0.0766 },
  { name: "Spitalfields", lat: 51.5196, lng: -0.0749 },
  { name: "Whitechapel", lat: 51.5196, lng: -0.0596 },
  { name: "Limehouse", lat: 51.5123, lng: -0.0396 },
  { name: "Canary Wharf", lat: 51.5054, lng: -0.0235 },
  { name: "Shoreditch", lat: 51.5255, lng: -0.0786 },
  { name: "Soho", lat: 51.5136, lng: -0.1365 },
  { name: "Camden", lat: 51.539, lng: -0.1426 },
];

export const DEFAULT_CENTER = { lat: 51.508, lng: -0.065 };
