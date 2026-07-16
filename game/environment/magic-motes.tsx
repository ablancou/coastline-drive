"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  type InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from "three";
import {
  getCoastCurve,
  getActiveTrack,
} from "@/game/procedural/geometry/road-path";
import { cliffHeightAt } from "@/game/procedural/geometry/terrain";
import { useSceneStore } from "@/stores/scene-store";

const COUNT = 110;
const NIGHT_COLOR = new Color("#ffd9a0");
const DAY_COLOR = new Color("#d8f2ff");

function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function makeGlowTexture(): CanvasTexture {
  const size = 32;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(c);
}

const _p = new Vector3();
const _tan = new Vector3();
const _side = new Vector3();
const UP = new Vector3(0, 1, 0);

/**
 * Magic light motes drifting over the shoreline strip: warm fireflies at
 * night, faint sea-sparkle by day. Instanced billboards on gentle sine paths —
 * one draw call, zero allocations per frame.
 */
export function MagicMotes() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const data = useMemo(() => {
    const curve = getCoastCurve();
    const seaXdir = getActiveTrack().seaXdir;
    const base = new Float32Array(COUNT * 3);
    const phase = new Float32Array(COUNT);
    const amp = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const t = 0.02 + hash01(i, 1.7) * 0.96;
      curve.getPoint(t, _p);
      curve.getTangent(t, _tan).normalize();
      _side.crossVectors(UP, _tan).normalize();
      // Landward strip over beach + meadow (4..30m inland of the waterline).
      const inland = 4 + hash01(i, 2.9) * 26;
      const x = _p.x - _side.x * seaXdir * inland;
      const z = _p.z - _side.z * seaXdir * inland;
      base[i * 3] = x;
      base[i * 3 + 1] = cliffHeightAt(x, z) + 0.8 + hash01(i, 4.1) * 2.6;
      base[i * 3 + 2] = z;
      phase[i] = hash01(i, 5.3) * Math.PI * 2;
      amp[i] = 0.6 + hash01(i, 6.7) * 1.2;
    }
    return { base, phase, amp };
  }, []);

  const geo = useMemo(() => new PlaneGeometry(0.32, 0.32), []);
  const mat = useMemo(
    () =>
      new MeshBasicMaterial({
        map: makeGlowTexture(),
        transparent: true,
        opacity: 0.0,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        color: DAY_COLOR,
      }),
    [],
  );

  const { camera } = useThree();

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const night = useSceneStore.getState().night;

    // Ease brightness + tint between day sparkle and night firefly.
    const targetOpacity = night ? 0.95 : 0.3;
    mat.opacity += (targetOpacity - mat.opacity) * 0.02;
    mat.color.lerp(night ? NIGHT_COLOR : DAY_COLOR, 0.02);

    for (let i = 0; i < COUNT; i++) {
      const ph = data.phase[i]!;
      const a = data.amp[i]!;
      dummy.position.set(
        data.base[i * 3]! + Math.sin(t * 0.31 + ph) * a,
        data.base[i * 3 + 1]! + Math.sin(t * 0.53 + ph * 1.7) * 0.55,
        data.base[i * 3 + 2]! + Math.cos(t * 0.27 + ph) * a,
      );
      dummy.quaternion.copy(camera.quaternion);
      // Twinkle: each mote breathes at its own rhythm.
      const tw = 0.55 + 0.45 * Math.sin(t * (1.1 + ph * 0.2) + ph * 3);
      dummy.scale.setScalar(0.7 + tw);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, COUNT]} frustumCulled={false} />;
}
