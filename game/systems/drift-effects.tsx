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

const SKID_COUNT = 300;
const SMOKE_COUNT = 110;
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
      vel: new Float32Array(SMOKE_COUNT * 3),
      life: new Float32Array(SMOKE_COUNT).fill(99),
      maxLife: 1.25,
      size: 2.3,
    }),
    [],
  );

  const dummy = useMemo(() => new Object3D(), []);
  const fwd = useMemo(() => new Vector3(), []);

  const skidGeo = useMemo(() => new PlaneGeometry(0.3, 0.6), []);
  const skidMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: 0x08080a,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      }),
    [],
  );
  const smokeTex = useMemo(() => makeSmokeTexture(), []);
  const smokeGeo = useMemo(() => new PlaneGeometry(1, 1), []);
  const smokeMat = useMemo(
    () =>
      new MeshBasicMaterial({
        map: smokeTex,
        color: 0xd8dde3,
        transparent: true,
        depthWrite: false,
        opacity: 0.62,
      }),
    [smokeTex],
  );

  useFrame((_, dt) => {
    const skid = skidRef.current;
    const smk = smokeRef.current;
    if (!skid || !smk) return;

    fwd.copy(FORWARD).applyQuaternion(vehicleTarget.quaternion);
    const yaw = Math.atan2(fwd.x, fwd.z);
    const speed = vehicleTarget.velocity.length();
    const slip = Math.abs(vehicleTarget.slip);
    // Drift = sliding sideways, or a handbrake slide, above a walking pace.
    const drifting =
      vehicleTarget.active &&
      speed > 4 &&
      (slip > 0.12 || (vehicleTarget.handbrake && speed > 6));
    // More intense slides throw more/bigger smoke.
    const intensity = Math.min(1, slip * 3 + (vehicleTarget.handbrake ? 0.5 : 0));

    const px = vehicleTarget.position.x;
    const pz = vehicleTarget.position.z;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    // Lateral (sideways) world direction — smoke billows out of the slide.
    const latX = cos;
    const latZ = -sin;
    const slideSign = vehicleTarget.slip >= 0 ? 1 : -1;

    if (drifting) {
      const puffs = 1 + Math.round(intensity * 2); // 1–3 puffs per wheel per frame
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

        // Spawn smoke puffs with sideways + upward drift.
        for (let p = 0; p < puffs; p++) {
          const si = smokeIdx.current;
          const jx = (p - puffs / 2) * 0.18;
          smoke.pos[si * 3] = wx + latX * jx;
          smoke.pos[si * 3 + 1] = ROAD_Y + 0.2;
          smoke.pos[si * 3 + 2] = wz + latZ * jx;
          smoke.vel[si * 3] = latX * slideSign * (0.8 + intensity * 1.4) - fwd.x * 0.5;
          smoke.vel[si * 3 + 1] = 0.7 + intensity * 0.6;
          smoke.vel[si * 3 + 2] = latZ * slideSign * (0.8 + intensity * 1.4) - fwd.z * 0.5;
          smoke.life[si] = 0;
          smokeIdx.current = (smokeIdx.current + 1) % SMOKE_COUNT;
        }
      }
      skid.instanceMatrix.needsUpdate = true;
    }

    // Animate smoke (always — puffs drift, rise, expand and fade out).
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const l = smoke.life[i]!;
      if (l < smoke.maxLife) {
        const t = l / smoke.maxLife;
        smoke.life[i] = l + dt;
        // Integrate drift velocity; slow it down over time (air drag).
        const drag = 1 - Math.min(1, dt * 1.6);
        smoke.pos[i * 3] = (smoke.pos[i * 3] ?? 0) + (smoke.vel[i * 3] ?? 0) * dt;
        smoke.pos[i * 3 + 1] = (smoke.pos[i * 3 + 1] ?? 0) + (smoke.vel[i * 3 + 1] ?? 0) * dt;
        smoke.pos[i * 3 + 2] = (smoke.pos[i * 3 + 2] ?? 0) + (smoke.vel[i * 3 + 2] ?? 0) * dt;
        smoke.vel[i * 3] = (smoke.vel[i * 3] ?? 0) * drag;
        smoke.vel[i * 3 + 2] = (smoke.vel[i * 3 + 2] ?? 0) * drag;
        // Grow from small to full, then fade → soft billow.
        const grow = 0.35 + t * 0.65;
        const s = Math.sin(t * Math.PI) * smoke.size * grow;
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
