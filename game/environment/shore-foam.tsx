"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { MeshBasicMaterial } from "three";
import { createShoreFoamGeometry } from "@/game/procedural/geometry/shore-foam";

/**
 * Two pulsing surf lines along the shoreline — a bright inner wash right at the
 * waterline and a fainter outer band. The animated ocean swell periodically
 * rolls over them, selling breaking waves without any texture assets.
 */
export function ShoreFoam() {
  const inner = useMemo(() => createShoreFoamGeometry(1.8, 3.4, -1.18, 420), []);
  const outer = useMemo(() => createShoreFoamGeometry(4.2, 7.2, -1.26, 420), []);

  const innerMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    [],
  );
  const outerMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: 0xeaf6f8,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    innerMat.opacity = 0.38 + 0.2 * Math.sin(t * 0.85);
    outerMat.opacity = 0.16 + 0.13 * Math.sin(t * 0.85 + 2.4);
  });

  return (
    <>
      <mesh geometry={inner} material={innerMat} />
      <mesh geometry={outer} material={outerMat} />
    </>
  );
}
