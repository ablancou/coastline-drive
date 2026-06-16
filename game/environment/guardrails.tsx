"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, MeshStandardMaterial } from "three";
import { buildGuardrailMeshes } from "@/game/procedural/geometry/guardrail";

/** Instanced guardrails along the ocean-side road edge — 100% procedural. */
export function Guardrails() {
  const data = useMemo(() => buildGuardrailMeshes(), []);

  const postRef = useRef<InstancedMesh>(null);
  const lowerRailRef = useRef<InstancedMesh>(null);
  const upperRailRef = useRef<InstancedMesh>(null);

  const postMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0xb8c4d0,
        metalness: 0.82,
        roughness: 0.28,
      }),
    [],
  );

  const railMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0x9aa8b8,
        metalness: 0.75,
        roughness: 0.32,
      }),
    [],
  );

  useLayoutEffect(() => {
    const posts = postRef.current;
    if (posts) {
      posts.instanceMatrix.set(data.postMatrices);
      posts.instanceMatrix.needsUpdate = true;
    }

    if (data.railSegmentCount > 0) {
      const lower = lowerRailRef.current;
      const upper = upperRailRef.current;
      if (lower) {
        lower.instanceMatrix.set(data.lowerRailMatrices);
        lower.instanceMatrix.needsUpdate = true;
      }
      if (upper) {
        upper.instanceMatrix.set(data.upperRailMatrices);
        upper.instanceMatrix.needsUpdate = true;
      }
    }
  }, [data]);

  return (
    <group>
      <instancedMesh
        ref={postRef}
        args={[data.postGeometry, postMaterial, data.postCount]}
        castShadow
        receiveShadow
      />
      {data.railSegmentCount > 0 ? (
        <>
          <instancedMesh
            ref={lowerRailRef}
            args={[data.railGeometry, railMaterial, data.railSegmentCount]}
            castShadow
          />
          <instancedMesh
            ref={upperRailRef}
            args={[data.railGeometry, railMaterial, data.railSegmentCount]}
            castShadow
          />
        </>
      ) : null}
    </group>
  );
}