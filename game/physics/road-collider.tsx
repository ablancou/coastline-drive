"use client";

import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { Vector3 } from "three";
import { ROAD_SEGMENTS, ROAD_WIDTH, sampleRoadFrame } from "@/game/procedural/geometry/road-path";

const f0 = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };
const f1 = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };
const _mid = new Vector3();

interface RoadSegmentCollider {
  position: [number, number, number];
  rotation: [number, number, number];
  halfExtents: [number, number, number];
}

/** Thick box colliders along the road spline — reliable raycast + wheel contact. */
function buildRoadSegmentColliders(): RoadSegmentCollider[] {
  const segments: RoadSegmentCollider[] = [];
  const step = 10;
  const halfW = ROAD_WIDTH * 0.5;
  const thickness = 0.2;

  for (let i = 0; i < ROAD_SEGMENTS; i += step) {
    const t0 = i / ROAD_SEGMENTS;
    const t1 = Math.min(1, (i + step) / ROAD_SEGMENTS);
    sampleRoadFrame(t0, f0);
    sampleRoadFrame(t1, f1);

    _mid.copy(f0.point).add(f1.point).multiplyScalar(0.5);
    const segLen = f0.point.distanceTo(f1.point);
    const yaw = Math.atan2(f0.tangent.x, f0.tangent.z);

    segments.push({
      position: [_mid.x, _mid.y + thickness, _mid.z],
      rotation: [0, yaw, 0],
      halfExtents: [halfW, thickness, segLen * 0.5 + 0.5],
    });
  }

  return segments;
}

export function RoadColliders() {
  const segments = useMemo(() => buildRoadSegmentColliders(), []);

  return (
    <group>
      {segments.map((seg, index) => (
        <RigidBody
          key={`road-seg-${index}`}
          type="fixed"
          colliders="cuboid"
          args={seg.halfExtents}
          position={seg.position}
          rotation={seg.rotation}
          friction={1.5}
          restitution={0.02}
        />
      ))}
    </group>
  );
}