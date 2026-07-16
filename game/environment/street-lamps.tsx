"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import {
  getRoadInteriorSign,
  ROAD_WIDTH,
  sampleRoadFrame,
} from "@/game/procedural/geometry/road-path";
import { useSceneStore } from "@/stores/scene-store";

const COUNT = 48;

/**
 * Highway lamp posts on the land shoulder, arms reaching over the road. The
 * warm heads are dark by day and glow at night (one shared emissive material,
 * eased in useFrame — bloom does the rest). No real PointLights: 26 of them
 * would melt the frame budget; emissive + bloom reads just as well.
 */
export function StreetLamps() {
  const headMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0x3a3428,
        emissive: 0xffd27a,
        emissiveIntensity: 0.0,
        roughness: 0.4,
      }),
    [],
  );

  const root = useMemo(() => {
    const g = new Group();
    const sign = getRoadInteriorSign();
    const frame = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };

    const poleGeo = new CylinderGeometry(0.07, 0.1, 5.2, 8);
    const armGeo = new BoxGeometry(0.08, 0.08, 1.7);
    const headGeo = new SphereGeometry(0.16, 10, 8);
    const poleMat = new MeshStandardMaterial({ color: 0x3c434b, roughness: 0.6, metalness: 0.5 });

    for (let i = 0; i < COUNT; i++) {
      const t = 0.02 + (0.96 * i) / (COUNT - 1);
      sampleRoadFrame(t, frame);
      const lateral = sign * (ROAD_WIDTH * 0.5 + 1.4);
      const x = frame.point.x + frame.side.x * lateral;
      const z = frame.point.z + frame.side.z * lateral;

      const lamp = new Group();
      const pole = new Mesh(poleGeo, poleMat);
      pole.position.y = 2.6;
      pole.castShadow = false;
      lamp.add(pole);

      // Arm leans back over the asphalt; head hangs at its tip.
      const arm = new Mesh(armGeo, poleMat);
      arm.position.set(0, 5.1, -sign * 0.8);
      lamp.add(arm);
      const head = new Mesh(headGeo, headMat);
      head.position.set(0, 5.0, -sign * 1.55);
      lamp.add(head);

      lamp.position.set(x, frame.point.y, z);
      // Face across the road so the arm points over the lanes.
      lamp.rotation.y = Math.atan2(frame.side.x, frame.side.z);
      g.add(lamp);
    }
    return g;
  }, [headMat]);

  useFrame(() => {
    const target = useSceneStore.getState().night ? 3.2 : 0.0;
    headMat.emissiveIntensity += (target - headMat.emissiveIntensity) * 0.04;
  });

  return <primitive object={root} />;
}
