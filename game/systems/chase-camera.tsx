"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { CAMERA_BASE_FOV, CHASE_CAMERA } from "@/game/constants/camera";
import { computeChaseCameraPose } from "@/game/systems/chase-camera-math";
import { vehicleTarget } from "@/game/systems/vehicle-target";

const _pose = {
  position: new Vector3(),
  lookAt: new Vector3(),
};

/**
 * Smooth third-person chase camera behind the vehicle.
 * Snaps on the first active frame to avoid the initial ground swoop.
 */
export function ChaseCamera() {
  const { camera } = useThree();
  const lookPoint = useRef(new Vector3());
  const snapped = useRef(false);
  const roll = useRef(0);

  useFrame((state, delta) => {
    if (!vehicleTarget.active) return;

    const cfg = CHASE_CAMERA;
    const speed = vehicleTarget.velocity.length();

    computeChaseCameraPose(
      vehicleTarget.position,
      vehicleTarget.quaternion,
      speed,
      _pose,
    );

    if (!snapped.current) {
      camera.position.copy(_pose.position);
      lookPoint.current.copy(_pose.lookAt);
      snapped.current = true;
      camera.lookAt(lookPoint.current);
      return;
    }

    const posAlpha = 1 - Math.exp(-cfg.positionDamping * delta);
    const lookAlpha = 1 - Math.exp(-cfg.lookDamping * delta);

    camera.position.lerp(_pose.position, posAlpha);
    lookPoint.current.lerp(_pose.lookAt, lookAlpha);

    // Impact shake — random jitter scaled by the transient shake value.
    if (vehicleTarget.shake > 0.001) {
      const s = vehicleTarget.shake;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
      camera.position.z += (Math.random() - 0.5) * s;
      vehicleTarget.shake *= Math.exp(-12 * delta);
    } else {
      vehicleTarget.shake = 0;
    }

    // High-speed micro-bob — a faint vertical shimmer that sells velocity.
    const speedNorm = Math.min(speed / 45, 1);
    if (speedNorm > 0.35) {
      const t = state.clock.elapsedTime;
      camera.position.y +=
        Math.sin(t * 11.3) * 0.012 * speedNorm + Math.sin(t * 17.7) * 0.006 * speedNorm;
    }

    camera.lookAt(lookPoint.current);

    // Lean the horizon slightly into a drift (slip angle), like a chase heli.
    const rollTarget = Math.max(-0.045, Math.min(0.045, -vehicleTarget.slip * 0.35));
    roll.current += (rollTarget - roll.current) * (1 - Math.exp(-5 * delta));
    if (Math.abs(roll.current) > 0.0004) camera.rotateZ(roll.current);

    // Speed sense — widen FOV slightly as speed rises.
    if (camera instanceof PerspectiveCamera) {
      const targetFov = CAMERA_BASE_FOV + Math.min(speed * 0.42, 14);
      camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-4 * delta));
      camera.updateProjectionMatrix();
    }
  });

  return null;
}