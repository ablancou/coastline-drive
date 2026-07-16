"use client";

import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { getBiome } from "@/game/constants/biomes";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { Boats } from "@/game/environment/boats";
import { Buildings } from "@/game/environment/buildings";
import { CliffRocks } from "@/game/environment/cliff-rocks";
import { CoastalProps } from "@/game/environment/coastal-props";
import { FinishLine } from "@/game/environment/finish-line";
import { Flowers } from "@/game/environment/flowers";
import { Foliage } from "@/game/environment/foliage";
import { MagicMotes } from "@/game/environment/magic-motes";
import { Guardrails } from "@/game/environment/guardrails";
import { Ocean } from "@/game/environment/ocean";
import { Seagulls } from "@/game/environment/seagulls";
import { ShoreFoam } from "@/game/environment/shore-foam";
import { StreetLamps } from "@/game/environment/street-lamps";
import {
  createRoadGeometry,
  createRoadMarkingsGeometry,
} from "@/game/procedural/geometry/road";
import { createTerrainGeometry } from "@/game/procedural/geometry/terrain";
import { createAsphaltTexture } from "@/game/procedural/textures/asphalt";
import { useSceneStore } from "@/stores/scene-store";

/** Assembles procedural coastal environment — zero external asset files. */
export function CoastalScene() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const biome = getBiome(SKY_PRESETS[skyIndex % SKY_PRESETS.length]?.id ?? "");

  const roadGeometry = useMemo(() => createRoadGeometry(), []);
  const markingsGeometry = useMemo(() => createRoadMarkingsGeometry(), []);
  const terrainGeometry = useMemo(
    () => createTerrainGeometry(520, 3800, 260, biome),
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

  const markingsMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#eef2f0",
        emissive: "#20242a",
        roughness: 0.55,
        metalness: 0.0,
      }),
    [],
  );

  return (
    <group>
      <mesh geometry={roadGeometry} material={roadMaterial} receiveShadow castShadow />
      <mesh geometry={markingsGeometry} material={markingsMaterial} receiveShadow />
      <mesh geometry={terrainGeometry} material={terrainMaterial} receiveShadow castShadow />
      <Guardrails />
      <CliffRocks />
      <Foliage biome={biome} />
      {biome.urban && <Buildings />}
      <CoastalProps />
      <Ocean />
      <ShoreFoam />
      <Boats />
      <Seagulls />
      <StreetLamps />
      <Flowers />
      <MagicMotes />
      <FinishLine />
    </group>
  );
}