"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CanvasTexture,
  type InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from "three";
import { vehicleTarget } from "@/game/systems/vehicle-target";

const SKID_COUNT = 160;
const SMOKE_COUNT = 52;
const ROAD_Y = 0.04;
const FORWARD = new Vector3(0, 0, 1);

// Rear contact points (local X, Z) — where rubber meets road.
const REAR = [
  [-0.86, -1.38],
  [0.86, -1.38],
] as const;

function makeSmokeTexture(): CanvasTexture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.5, "rgba(235,238,242,0.4)");
  g.addColorStop(1, "rgba(235,238,242,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(c);
}

/** Tire smoke + skid marks emitted while drifting. Instanced, allocation-free. */
export function DriftEffects() {
  const { camera } = useThree();
  const skidRef = useRef<InstancedMesh>(null);
  const smokeRef = useRef<InstancedMesh>(null);
  const skidIdx = useRef(0);
  const smokeIdx = useRef(0);

  // Per-smoke state (recycled ring buffer).
  const smoke = useMemo(
    () => ({
      pos: new Float32Array(SMOKE_COUNT * 3),
      life: new Float32Array(SMOKE_COUNT).fill(99),
      maxLife: 0.9,
      size: 1.4,
    }),
    [],
  );

  const dummy = useMemo(() => new Object3D(), []);
  const fwd = useMemo(() => new Vector3(), []);

  const skidGeo = useMemo(() => new PlaneGeometry(0.22, 0.55), []);
  const skidMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: 0x0a0a0a,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      }),
    [],
  );
  const smokeTex = useMemo(() => makeSmokeTexture(), []);
  const smokeGeo = useMemo(() => new PlaneGeometry(1, 1), []);
  const smokeMat = useMemo(
    () => new MeshBasicMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0.5 }),
    [smokeTex],
  );

  useFrame((_, dt) => {
    const skid = skidRef.current;
    const smk = smokeRef.current;
    if (!skid || !smk) return;

    fwd.copy(FORWARD).applyQuaternion(vehicleTarget.quaternion);
    const yaw = Math.atan2(fwd.x, fwd.z);
    const speed = vehicleTarget.velocity.length();
    const drifting = vehicleTarget.active && Math.abs(vehicleTarget.slip) > 0.14 && speed > 5;

    const px = vehicleTarget.position.x;
    const pz = vehicleTarget.position.z;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);

    if (drifting) {
      for (const [lx, lz] of REAR) {
        // Rotate local offset by yaw → world.
        const wx = px + (lx * cos + lz * sin);
        const wz = pz + (-lx * sin + lz * cos);

        // Skid mark.
        dummy.position.set(wx, ROAD_Y, wz);
        dummy.rotation.set(-Math.PI / 2, yaw, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        skid.setMatrixAt(skidIdx.current, dummy.matrix);
        skidIdx.current = (skidIdx.current + 1) % SKID_COUNT;

        // Spawn a smoke puff.
        const si = smokeIdx.current;
        smoke.pos[si * 3] = wx;
        smoke.pos[si * 3 + 1] = ROAD_Y + 0.2;
        smoke.pos[si * 3 + 2] = wz;
        smoke.life[si] = 0;
        smokeIdx.current = (smokeIdx.current + 1) % SMOKE_COUNT;
      }
      skid.instanceMatrix.needsUpdate = true;
    }

    // Animate smoke (always — puffs fade out over their life).
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const l = smoke.life[i]!;
      if (l < smoke.maxLife) {
        const t = l / smoke.maxLife;
        smoke.life[i] = l + dt;
        smoke.pos[i * 3 + 1] = (smoke.pos[i * 3 + 1] ?? 0) + dt * 0.7; // rise
        const s = Math.sin(t * Math.PI) * smoke.size; // grow then shrink → soft fade
        dummy.position.set(smoke.pos[i * 3]!, smoke.pos[i * 3 + 1]!, smoke.pos[i * 3 + 2]!);
        dummy.quaternion.copy(camera.quaternion); // billboard
        dummy.scale.setScalar(Math.max(0.001, s));
        dummy.updateMatrix();
        smk.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.setScalar(0.001);
        dummy.position.set(0, -999, 0);
        dummy.updateMatrix();
        smk.setMatrixAt(i, dummy.matrix);
      }
    }
    smk.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={skidRef} args={[skidGeo, skidMat, SKID_COUNT]} frustumCulled={false} />
      <instancedMesh ref={smokeRef} args={[smokeGeo, smokeMat, SMOKE_COUNT]} frustumCulled={false} />
    </>
  );
}
