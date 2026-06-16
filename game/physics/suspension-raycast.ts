import type { RapierRigidBody } from "@react-three/rapier";
import type { Quaternion } from "three";
import { Vector3 } from "three";
import { VEHICLE_CONFIG } from "@/game/constants/vehicle";
import { getRoadSurfaceY } from "@/game/procedural/geometry/road-path";

// Pre-allocated scratch — zero allocations inside the physics hot path.
const _wheelOffset = new Vector3();

/**
 * Analytic suspension sampling using the road spline height.
 * Visual + grounded flags only — the kinematic integrator pins the chassis Y
 * to the road spline, so this never drives the vertical pose.
 */
export function applyRaycastSuspension(
  chassis: RapierRigidBody,
  chassisQuat: Quaternion,
  suspensionLengths: number[],
  wheelGrounded: boolean[],
): void {
  const { suspension, wheels } = VEHICLE_CONFIG;
  const pos = chassis.translation();

  if (
    !Number.isFinite(pos.x) ||
    !Number.isFinite(pos.y) ||
    !Number.isFinite(pos.z)
  ) {
    return;
  }

  for (let i = 0; i < wheels.length; i++) {
    const wheel = wheels[i]!;
    _wheelOffset.set(...wheel.position).applyQuaternion(chassisQuat);

    const hubX = pos.x + _wheelOffset.x;
    const hubY = pos.y + _wheelOffset.y;
    const hubZ = pos.z + _wheelOffset.z;

    if (
      !Number.isFinite(hubX) ||
      !Number.isFinite(hubY) ||
      !Number.isFinite(hubZ)
    ) {
      wheelGrounded[i] = false;
      continue;
    }

    const roadY = getRoadSurfaceY(hubX, hubZ);
    if (!Number.isFinite(roadY)) {
      wheelGrounded[i] = false;
      continue;
    }

    const springLength = Math.max(0, hubY - roadY - wheel.radius);
    suspensionLengths[i] = springLength;

    wheelGrounded[i] =
      springLength <= suspension.restLength + suspension.maxTravel + 0.15;
  }
}