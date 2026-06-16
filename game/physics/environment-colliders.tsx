"use client";

import { MeshCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { createTerrainGeometry } from "@/game/procedural/geometry/terrain";

/** Terrain trimesh collider — road uses dedicated box segments in RoadColliders. */
export function EnvironmentColliders() {
  // Lower-resolution trimesh for the collider (the kinematic car doesn't use it
  // for ground contact, but keep it light for any future dynamic bodies).
  const terrainGeometry = useMemo(() => createTerrainGeometry(340, 560, 64), []);

  return (
    <RigidBody type="fixed" colliders={false} friction={0.9} restitution={0.0}>
      <MeshCollider type="trimesh">
        <mesh geometry={terrainGeometry} visible={false} />
      </MeshCollider>
    </RigidBody>
  );
}