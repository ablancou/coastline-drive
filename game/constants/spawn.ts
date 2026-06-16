import { Vector3 } from "three";
import { getRoadSurfaceAt, sampleRoadFrame } from "@/game/procedural/geometry/road-path";
import { VEHICLE_CONFIG } from "@/game/constants/vehicle";
import { finiteOr } from "@/lib/math";

/** Param along the coastal spline where the lap begins (also the finish line). */
export const SPAWN_T = 0.04;

const frame = {
  point: new Vector3(),
  tangent: new Vector3(),
  side: new Vector3(),
};

const surface = {
  y: 0,
  tangent: new Vector3(),
  point: new Vector3(),
  side: new Vector3(),
};

export interface VehicleSpawnPose {
  position: Vector3;
  rotationY: number;
}

/**
 * Chassis-center Y when wheels are at rest on the road surface.
 * hubOffset + restLength + wheelRadius — must match suspension math.
 */
export function getChassisRestHeightAboveRoad(): number {
  const { restLength } = VEHICLE_CONFIG.suspension;
  const wheel = VEHICLE_CONFIG.wheels[0]!;
  const hubOffset = Math.abs(wheel.position[1]);
  return hubOffset + restLength + wheel.radius;
}

/** Spawn pose aligned to the procedural road spline. */
export function getVehicleSpawnPose(): VehicleSpawnPose {
  sampleRoadFrame(SPAWN_T, frame);
  getRoadSurfaceAt(frame.point.x, frame.point.z, surface);

  const restY = surface.y + getChassisRestHeightAboveRoad();

  return {
    position: new Vector3(
      finiteOr(frame.point.x, -4),
      finiteOr(restY, 0.84),
      finiteOr(frame.point.z, 76),
    ),
    rotationY: finiteOr(Math.atan2(frame.tangent.x, frame.tangent.z), 0),
  };
}