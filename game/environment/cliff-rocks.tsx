"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, MeshStandardMaterial } from "three";
import { buildCliffRockInstances } from "@/game/procedural/geometry/cliff-rocks";

/** Instanced cliff rock outcrops — inland side of the coastal highway. */
export function CliffRocks() {
  const data = useMemo(() => buildCliffRockInstances(), []);
  const meshRef = useRef<InstancedMesh>(null);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0x6a5d52,
        metalness: 0.04,
        roughness: 0.92,
        flatShading: true,
      }),
    [],
  );

  useLayoutEffect(() => {
    meshRef.current?.instanceMatrix.set(data.matrices);
    meshRef.current!.instanceMatrix.needsUpdate = true;
  }, [data]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[data.geometry, material, data.count]}
      castShadow
      receiveShadow
    />
  );
}