"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import {
  getActiveTrack,
  getCoastCurve,
} from "@/game/procedural/geometry/road-path";
import { useSceneStore } from "@/stores/scene-store";

const COUNT = 6;

interface Gull {
  group: Object3D;
  leftWing: Object3D;
  rightWing: Object3D;
  centerX: number;
  centerZ: number;
  radius: number;
  height: number;
  angularSpeed: number;
  phase: number;
}

const _p = new Vector3();
const _tan = new Vector3();
const _side = new Vector3();
const UP = new Vector3(0, 1, 0);

/**
 * Ambient seagulls circling over the shoreline — two small flocks gliding in
 * lazy circles with a wing flap. Pure procedural boxes; hidden at night.
 */
export function Seagulls() {
  const night = useSceneStore((s) => s.night);
  const gullsRef = useRef<Gull[]>([]);

  const root = useMemo(() => {
    const g = new Group();
    const bodyGeo = new BoxGeometry(0.16, 0.12, 0.55);
    const wingGeo = new BoxGeometry(0.85, 0.03, 0.26);
    const white = new MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.8 });
    const grey = new MeshStandardMaterial({ color: 0xb8bec6, roughness: 0.85 });

    const curve = getCoastCurve();
    const seaXdir = getActiveTrack().seaXdir;
    const gulls: Gull[] = [];

    for (let i = 0; i < COUNT; i++) {
      const bird = new Group();
      const body = new Mesh(bodyGeo, white);
      bird.add(body);

      const leftWing = new Mesh(wingGeo, grey);
      leftWing.position.set(-0.5, 0.02, 0);
      const rightWing = new Mesh(wingGeo, grey);
      rightWing.position.set(0.5, 0.02, 0);
      bird.add(leftWing, rightWing);
      g.add(bird);

      // Two flocks: near 1/3 and 2/3 of the coastline, drifting over the surf.
      const t = i < COUNT / 2 ? 0.32 : 0.68;
      curve.getPoint(t, _p);
      curve.getTangent(t, _tan).normalize();
      _side.crossVectors(UP, _tan).normalize();
      const seawards = 6 + (i % 3) * 7;
      gulls.push({
        group: bird,
        leftWing,
        rightWing,
        centerX: _p.x + _side.x * seaXdir * seawards,
        centerZ: _p.z + _side.z * seaXdir * seawards,
        radius: 9 + (i % 3) * 5,
        height: 14 + (i % 4) * 4,
        angularSpeed: (0.25 + (i % 3) * 0.07) * (i % 2 === 0 ? 1 : -1),
        phase: i * 1.13,
      });
    }
    gullsRef.current = gulls;
    return g;
  }, []);

  useFrame((state) => {
    if (night) return;
    const t = state.clock.elapsedTime;
    for (const gull of gullsRef.current) {
      const a = t * gull.angularSpeed + gull.phase;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      gull.group.position.set(
        gull.centerX + cos * gull.radius,
        gull.height + Math.sin(t * 0.6 + gull.phase) * 1.6,
        gull.centerZ + sin * gull.radius,
      );
      // Face along the flight direction (tangent of the circle).
      const dir = gull.angularSpeed >= 0 ? 1 : -1;
      gull.group.rotation.y = Math.atan2(-sin * dir, cos * dir);
      // Glide with intermittent flapping.
      const flap = Math.sin(t * 6 + gull.phase);
      const wing = Math.max(0, flap) * 0.55 + 0.08;
      gull.leftWing.rotation.z = wing;
      gull.rightWing.rotation.z = -wing;
    }
  });

  return <primitive object={root} visible={!night} />;
}
