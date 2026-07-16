"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
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

const COUNT = 7;
const HULL_COLORS = [0xf2f4f6, 0x24466b, 0xf2f4f6, 0x7a2e2e, 0x2f6a55, 0xf2f4f6, 0x8a6a2a];
/** Ocean plane sits at y = -1.5; hulls ride just above it. */
const SEA_Y = -1.5;

interface Boat {
  group: Object3D;
  phase: number;
  baseY: number;
}

const _p = new Vector3();
const _tan = new Vector3();
const _side = new Vector3();
const UP = new Vector3(0, 1, 0);

/**
 * Sailboats anchored offshore, bobbing and rocking on the swell — the
 * paradisiacal marina feel. Static XZ (anchored), animated pitch/roll/heave.
 */
export function Boats() {
  const boatsRef = useRef<Boat[]>([]);

  const root = useMemo(() => {
    const g = new Group();
    const hullGeo = new BoxGeometry(1.5, 0.7, 4.4);
    const mastGeo = new CylinderGeometry(0.05, 0.07, 5.4, 6);
    const sailGeo = new ConeGeometry(1.15, 4.2, 3);
    const sailMat = new MeshStandardMaterial({ color: 0xfdfdf8, roughness: 0.75 });
    const mastMat = new MeshStandardMaterial({ color: 0x8a7455, roughness: 0.7 });

    const curve = getCoastCurve();
    const seaXdir = getActiveTrack().seaXdir;
    const boats: Boat[] = [];

    for (let i = 0; i < COUNT; i++) {
      const boat = new Group();
      const hull = new Mesh(
        hullGeo,
        new MeshStandardMaterial({ color: HULL_COLORS[i % HULL_COLORS.length]!, roughness: 0.55 }),
      );
      hull.position.y = 0.15;
      boat.add(hull);

      const mast = new Mesh(mastGeo, mastMat);
      mast.position.y = 3.0;
      boat.add(mast);

      const sail = new Mesh(sailGeo, sailMat);
      sail.scale.z = 0.08; // flatten the cone into a triangular sail
      sail.position.set(0.02, 3.1, -0.35);
      boat.add(sail);

      // Anchor offshore along the coast, well out on the water.
      const t = 0.08 + i * 0.13;
      curve.getPoint(t, _p);
      curve.getTangent(t, _tan).normalize();
      _side.crossVectors(UP, _tan).normalize();
      const seawards = 38 + (i % 3) * 16;
      boat.position.set(
        _p.x + _side.x * seaXdir * seawards,
        SEA_Y + 0.42,
        _p.z + _side.z * seaXdir * seawards,
      );
      boat.rotation.y = i * 1.9;
      g.add(boat);
      boats.push({ group: boat, phase: i * 1.7, baseY: SEA_Y + 0.42 });
    }
    boatsRef.current = boats;
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (const b of boatsRef.current) {
      b.group.position.y = b.baseY + Math.sin(t * 0.8 + b.phase) * 0.16;
      b.group.rotation.z = Math.sin(t * 0.9 + b.phase) * 0.055;
      b.group.rotation.x = Math.sin(t * 0.66 + b.phase + 1.2) * 0.04;
    }
  });

  return <primitive object={root} />;
}
