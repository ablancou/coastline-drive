"use client";

import { Physics, RigidBody } from "@react-three/rapier";
import type { ReactNode } from "react";
import { EnvironmentColliders } from "@/game/physics/environment-colliders";
import { RoadColliders } from "@/game/physics/road-collider";

interface PhysicsWorldProps {
  children: ReactNode;
}

/** Rapier physics — road box segments + terrain trimesh + fallback ground. */
export function PhysicsWorld({ children }: PhysicsWorldProps) {
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} interpolate>
      <RoadColliders />
      <EnvironmentColliders />
      <RigidBody
        type="fixed"
        colliders="cuboid"
        args={[140, 0.4, 220]}
        position={[4, -0.35, -20]}
        friction={1.2}
        restitution={0.02}
      />
      {children}
    </Physics>
  );
}