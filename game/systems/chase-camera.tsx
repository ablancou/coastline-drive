"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { CHASE_CAMERA } from "@/game/constants/camera";
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

  useFrame((_, delta) => {
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

    camera.lookAt(lookPoint.current);
  });

  return null;
}