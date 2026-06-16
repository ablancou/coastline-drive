"use client";

import { MeshCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { createTerrainGeometry } from "@/game/procedural/geometry/terrain";

/** Terrain trimesh collider — road uses dedicated box segments in RoadColliders. */
export function EnvironmentColliders() {
  const terrainGeometry = useMemo(() => createTerrainGeometry(), []);

  return (
    <RigidBody type="fixed" colliders={false} friction={0.9} restitution={0.0}>
      <MeshCollider type="trimesh">
        <mesh geometry={terrainGeometry} visible={false} />
      </MeshCollider>
    </RigidBody>
  );
}