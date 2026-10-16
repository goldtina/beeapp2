import { lazy, Suspense, type ComponentProps } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type ShiftMapType from "./ShiftMap";
export type { MapPoint } from "./map-types";

const ShiftMap = lazy(() => import("./ShiftMap"));

export function MapView(props: ComponentProps<typeof ShiftMapType>) {
  const fallback = (
    <div style={{ height: props.height ?? 360 }} className="honeycomb w-full animate-pulse rounded-2xl border border-border bg-muted" />
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <ShiftMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
