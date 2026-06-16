"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Quaternion, Vector3 } from "three";
import { getVehicleSpawnPose } from "@/game/constants/spawn";
import { computeChaseCameraPose } from "@/game/systems/chase-camera-math";

const spawn = getVehicleSpawnPose();
const spawnQuat = new Quaternion().setFromAxisAngle(
  new Vector3(0, 1, 0),
  spawn.rotationY,
);
const _pose = {
  position: new Vector3(),
  lookAt: new Vector3(),
};

/** Sets initial camera pose before chase camera takes over. */
export function CameraBootstrap() {
  const { camera } = useThree();

  useEffect(() => {
    computeChaseCameraPose(spawn.position, spawnQuat, 0, _pose);
    camera.position.copy(_pose.position);
    camera.lookAt(_pose.lookAt);
  }, [camera]);

  return null;
}