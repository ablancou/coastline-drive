import type { RapierRigidBody } from "@react-three/rapier";
import type { VehicleSpawnPose } from "@/game/constants/spawn";

/** True when translation, linear velocity, and rotation are all finite. */
export function isChassisStateFinite(chassis: RapierRigidBody): boolean {
  const pos = chassis.translation();
  const vel = chassis.linvel();
  const rot = chassis.rotation();

  return (
    Number.isFinite(pos.x) &&
    Number.isFinite(pos.y) &&
    Number.isFinite(pos.z) &&
    Number.isFinite(vel.x) &&
    Number.isFinite(vel.y) &&
    Number.isFinite(vel.z) &&
    Number.isFinite(rot.x) &&
    Number.isFinite(rot.y) &&
    Number.isFinite(rot.z) &&
    Number.isFinite(rot.w)
  );
}

/** Hard reset after physics blow-up — restores spawn pose and zero velocity. */
export function resetChassisToSpawn(
  chassis: RapierRigidBody,
  spawn: VehicleSpawnPose,
): void {
  const halfYaw = spawn.rotationY * 0.5;
  chassis.setTranslation(
    { x: spawn.position.x, y: spawn.position.y, z: spawn.position.z },
    true,
  );
  chassis.setRotation(
    { x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) },
    true,
  );
  chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
  chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
}