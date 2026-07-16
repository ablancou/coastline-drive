"use client";

import { useMemo } from "react";
import {
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import {
  getCoastCurve,
  getActiveTrack,
  signedDistanceToCoast,
} from "@/game/procedural/geometry/road-path";
import { cliffHeightAt } from "@/game/procedural/geometry/terrain";

const COUNT = 170;
const PALETTE = ["#ff9fb8", "#ffe08a", "#ffffff", "#c9a0ff", "#ffb47a"];

function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const _p = new Vector3();
const _tan = new Vector3();
const _side = new Vector3();
const _pos = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();
const _m = new Matrix4();
const UP = new Vector3(0, 1, 0);
const _c = new Color();

/**
 * Wildflower confetti across the meadow band — tiny colored quads scattered
 * where the grass lives (inland of the beach, short of the cliffs). One
 * instanced draw, per-instance color, fully static.
 */
export function Flowers() {
  const mesh = useMemo(() => {
    const geo = new PlaneGeometry(0.22, 0.22);
    const mat = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
      side: DoubleSide,
    });
    const m = new InstancedMesh(geo, mat, COUNT);
    const curve = getCoastCurve();
    const seaXdir = getActiveTrack().seaXdir;

    let placed = 0;
    for (let i = 0; i < COUNT * 2 && placed < COUNT; i++) {
      const t = 0.02 + hash01(i, 3.1) * 0.96;
      curve.getPoint(t, _p);
      curve.getTangent(t, _tan).normalize();
      _side.crossVectors(UP, _tan).normalize();
      const inland = 7 + hash01(i, 4.3) * 30;
      const x = _p.x - _side.x * seaXdir * inland;
      const z = _p.z - _side.z * seaXdir * inland;
      const sd = signedDistanceToCoast(x, z);
      if (sd < 6 || sd > 42) continue; // meadow band only

      const y = cliffHeightAt(x, z);
      _pos.set(x, y + 0.1, z);
      _q.setFromAxisAngle(UP, hash01(i, 5.7) * Math.PI * 2);
      const sc = 0.7 + hash01(i, 6.1) * 0.9;
      _s.set(sc, sc, sc);
      _m.compose(_pos, _q, _s);
      m.setMatrixAt(placed, _m);
      _c.set(PALETTE[i % PALETTE.length]!);
      m.setColorAt(placed, _c);
      placed++;
    }
    m.count = placed;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    return m;
  }, []);

  return <primitive object={mesh} />;
}
