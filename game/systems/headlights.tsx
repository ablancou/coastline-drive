"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Object3D, type SpotLight, Vector3 } from "three";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useSceneStore } from "@/stores/scene-store";

const FORWARD = new Vector3(0, 0, 1);
const _fwd = new Vector3();
const _right = new Vector3();

/** Two forward-facing spotlights mounted on the car. Toggle with "L". */
export function Headlights() {
  const headlightsOn = useSceneStore((s) => s.headlightsOn);
  const night = useSceneStore((s) => s.night);
  const on = headlightsOn || night;
  const lRef = useRef<SpotLight>(null);
  const rRef = useRef<SpotLight>(null);
  const lTarget = useMemo(() => new Object3D(), []);
  const rTarget = useMemo(() => new Object3D(), []);

  useFrame(() => {
    const L = lRef.current;
    const R = rRef.current;
    if (!L || !R) return;
    L.target = lTarget;
    R.target = rTarget;

    if (!on || !vehicleTarget.active) {
      L.intensity = 0;
      R.intensity = 0;
      return;
    }

    _fwd.copy(FORWARD).applyQuaternion(vehicleTarget.quaternion);
    _right.set(_fwd.z, 0, -_fwd.x); // right of travel
    const p = vehicleTarget.position;

    for (const [light, target, side] of [
      [L, lTarget, -1],
      [R, rTarget, 1],
    ] as const) {
      light.position.set(
        p.x + _fwd.x * 1.9 + _right.x * 0.55 * side,
        p.y - 0.35,
        p.z + _fwd.z * 1.9 + _right.z * 0.55 * side,
      );
      target.position.set(
        p.x + _fwd.x * 18 + _right.x * 2 * side,
        p.y - 1.2,
        p.z + _fwd.z * 18 + _right.z * 2 * side,
      );
      target.updateMatrixWorld();
      light.intensity = night ? 11 : 6;
    }
  });

  return (
    <>
      <spotLight ref={lRef} color="#fff3d6" angle={0.55} penumbra={0.45} distance={48} decay={1.4} />
      <spotLight ref={rRef} color="#fff3d6" angle={0.55} penumbra={0.45} distance={48} decay={1.4} />
      <primitive object={lTarget} />
      <primitive object={rTarget} />
    </>
  );
}
