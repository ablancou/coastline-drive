"use client";

import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { CliffRocks } from "@/game/environment/cliff-rocks";
import { Guardrails } from "@/game/environment/guardrails";
import { createOceanMaterial } from "@/game/procedural/materials/ocean";
import { createRoadGeometry } from "@/game/procedural/geometry/road";
import { createTerrainGeometry } from "@/game/procedural/geometry/terrain";
import { createAsphaltTexture } from "@/game/procedural/textures/asphalt";

/** Assembles procedural coastal environment — zero external asset files. */
export function CoastalScene() {
  const roadGeometry = useMemo(() => createRoadGeometry(), []);
  const terrainGeometry = useMemo(() => createTerrainGeometry(), []);
  const asphaltTexture = useMemo(() => {
    const tex = createAsphaltTexture();
    tex.repeat.set(4, 20);
    return tex;
  }, []);
  const oceanMaterial = useMemo(() => createOceanMaterial(), []);

  const roadMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        map: asphaltTexture,
        vertexColors: true,
        metalness: 0.05,
        roughness: 0.88,
      }),
    [asphaltTexture],
  );

  const terrainMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        vertexColors: true,
        metalness: 0.03,
        roughness: 0.94,
        flatShading: true,
      }),
    [],
  );

  return (
    <group>
      <mesh geometry={roadGeometry} material={roadMaterial} receiveShadow castShadow />
      <mesh geometry={terrainGeometry} material={terrainMaterial} receiveShadow castShadow />
      <Guardrails />
      <CliffRocks />
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, -1.5, 0]}
        material={oceanMaterial}
        receiveShadow
      >
        <planeGeometry args={[1200, 1200, 1, 1]} />
      </mesh>
    </group>
  );
}