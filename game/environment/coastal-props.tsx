"use client";

import { useMemo } from "react";
import { buildCoastalProps } from "@/game/procedural/geometry/coastal-props";

/** Sailboats on the lagoon + beach parasols — procedural coastal dressing. */
export function CoastalProps() {
  const group = useMemo(() => buildCoastalProps(), []);
  return <primitive object={group} />;
}
