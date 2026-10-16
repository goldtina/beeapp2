import { format, isToday, isTomorrow } from "date-fns";

export function shiftWhen(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const day = isToday(s) ? (s.getHours() >= 17 ? "Tonight" : "Today") : isTomorrow(s) ? "Tomorrow" : format(s, "EEE d MMM");
  return `${day}, ${format(s, "h:mm a")}–${format(e, "h:mm a")}`;
}

export function shiftHours(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 36e5;
}

export function gbp(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(n);
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong";
}
