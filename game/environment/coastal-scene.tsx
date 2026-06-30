"use client";

import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { getBiome } from "@/game/constants/biomes";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { Buildings } from "@/game/environment/buildings";
import { CliffRocks } from "@/game/environment/cliff-rocks";
import { CoastalProps } from "@/game/environment/coastal-props";
import { Foliage } from "@/game/environment/foliage";
import { Guardrails } from "@/game/environment/guardrails";
import { Ocean } from "@/game/environment/ocean";
import { createRoadGeometry } from "@/game/procedural/geometry/road";
import { createTerrainGeometry } from "@/game/procedural/geometry/terrain";
import { createAsphaltTexture } from "@/game/procedural/textures/asphalt";
import { useSceneStore } from "@/stores/scene-store";

/** Assembles procedural coastal environment — zero external asset files. */
export function CoastalScene() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const biome = getBiome(SKY_PRESETS[skyIndex % SKY_PRESETS.length]?.id ?? "");

  const roadGeometry = useMemo(() => createRoadGeometry(), []);
  const terrainGeometry = useMemo(
    () => createTerrainGeometry(480, 1040, 220, biome),
    [biome],
  );
  const asphaltTexture = useMemo(() => {
    const tex = createAsphaltTexture();
    tex.repeat.set(4, 20);
    return tex;
  }, []);

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
      <Foliage biome={biome} />
      {biome.urban && <Buildings />}
      <CoastalProps />
      <Ocean />
    </group>
  );
}