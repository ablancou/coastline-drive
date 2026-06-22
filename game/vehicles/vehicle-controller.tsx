"use client";

import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import { Object3D, Quaternion, Vector3 } from "three";
import { TELEMETRY_FLUSH_INTERVAL } from "@/game/constants/input";
import { PHYSICS_TIMESTEP } from "@/game/constants/physics";
import { getChassisRestHeightAboveRoad, getVehicleSpawnPose } from "@/game/constants/spawn";
import { VEHICLE_CONFIG } from "@/game/constants/vehicle";
import { createCarBody } from "@/game/procedural/geometry/car-designs";
import { createWheelMesh } from "@/game/procedural/geometry/wheel";
import {
  getRoadSurfaceAt,
  type RoadSurfaceSample,
} from "@/game/procedural/geometry/road-path";
import { playImpact } from "@/game/procedural/audio/engine-audio";
import { applyRaycastSuspension } from "@/game/physics/suspension-raycast";
import { createInputSystem } from "@/game/systems/input-system";
import { updateVehicleTarget, vehicleTarget } from "@/game/systems/vehicle-target";
import { clamp, finiteOr, wrapAngle } from "@/lib/math";
import { useCustomizationStore } from "@/stores/customization-store";
import { useRaceStore } from "@/stores/race-store";
import { useTelemetryStore } from "@/stores/telemetry-store";
import type { MeshPhysicalMaterial } from "three";
import type { InputState } from "@/types/input";
import type { VehicleSimState } from "@/types/vehicle";

const UP = new Vector3(0, 1, 0);

// Pre-allocated scratch — zero allocations on the physics hot path.
const _chassisQuat = new Quaternion();
const _wheelOffset = new Vector3();
const _chassisDown = new Vector3();
const _wheelQuat = new Quaternion();
const _steerQuat = new Quaternion();
const _spinQuat = new Quaternion();
const _spinAxis = new Vector3(1, 0, 0);
const _vel = new Vector3();
const _nextQuat = new Quaternion();
// Frames remaining before another impact sound may trigger (~0.4s at 60 Hz).
let impactCooldown = 0;
const _surface: RoadSurfaceSample = {
  y: 0,
  tangent: new Vector3(),
  point: new Vector3(),
  side: new Vector3(),
};

function createInitialSimState(): VehicleSimState {
  const rest = VEHICLE_CONFIG.suspension.restLength;
  return {
    engineRpm: VEHICLE_CONFIG.idleRpm,
    steerAngle: 0,
    wheelSpin: VEHICLE_CONFIG.wheels.map(() => 0),
    speedMs: 0,
    heading: 0,
    velAngle: 0,
    bodyPitch: 0,
    bodyRoll: 0,
    suspensionLengths: VEHICLE_CONFIG.wheels.map(() => rest),
    wheelGrounded: VEHICLE_CONFIG.wheels.map(() => false),
  };
}

/**
 * Phase 1 vehicle: a `kinematicPosition` body driven by an analytic arcade-sim
 * integrator. The chassis Y is pinned to the road spline every step, so the car
 * can never fall through the world and the Rapier solver never integrates forces
 * on it (no NaN blow-ups). Lateral movement is clamped to the road width.
 */
export function VehicleController() {
  const chassisRef = useRef<RapierRigidBody>(null);
  const wheelRefs = useRef<(Object3D | null)[]>([]);
  const simRef = useRef<VehicleSimState>(createInitialSimState());
  const inputRef = useRef<InputState>({ throttle: 0, brake: 0, steer: 0, handbrake: false });
  const lastTelemetryFlushRef = useRef(0);

  const inputSystem = useMemo(() => createInputSystem(), []);
  const spawnPose = useMemo(() => getVehicleSpawnPose(), []);
  const restHeight = useMemo(() => getChassisRestHeightAboveRoad(), []);

  const carId = useCustomizationStore((s) => s.carId);
  const carColor = useCustomizationStore((s) => s.carColor);
  const wheelColor = useCustomizationStore((s) => s.wheelColor);
  const driver = useCustomizationStore((s) => s.driver);

  // Rebuild the body when the selected car changes (rare — Garage only).
  const bodyGroup = useMemo(() => createCarBody(carId), [carId]);
  const wheelObjects = useMemo(
    () => VEHICLE_CONFIG.wheels.map((w) => createWheelMesh(w.radius, wheelColor)),
    [wheelColor],
  );

  // Seed the integrator heading + travel direction from the spawn yaw (once).
  useMemo(() => {
    simRef.current.heading = spawnPose.rotationY;
    simRef.current.velAngle = spawnPose.rotationY;
  }, [spawnPose]);

  useEffect(() => {
    inputSystem.bind();
    return () => inputSystem.unbind();
  }, [inputSystem]);

  // Apply paint color (runtime, no rebuild).
  useEffect(() => {
    const paint = bodyGroup.userData.paintMaterial as MeshPhysicalMaterial | undefined;
    paint?.color.set(carColor);
  }, [bodyGroup, carColor]);

  // Swap driver figure.
  useEffect(() => {
    const man = bodyGroup.userData.driverMan as Object3D | undefined;
    const woman = bodyGroup.userData.driverWoman as Object3D | undefined;
    if (man) man.visible = driver === "man";
    if (woman) woman.visible = driver === "woman";
  }, [bodyGroup, driver]);

  useBeforePhysicsStep(() => {
    const chassis = chassisRef.current;
    if (!chassis) return;

    // Freeze the car before the countdown ends, while paused, or once finished.
    const race = useRaceStore.getState();
    if (!race.started || race.paused || race.finished) {
      simRef.current.speedMs = 0;
      return;
    }

    inputRef.current = inputSystem.poll();
    stepVehicle(chassis, simRef.current, inputRef.current, restHeight, spawnPose.rotationY);
  });

  useFrame((state) => {
    const chassis = chassisRef.current;
    if (!chassis) return;

    const sim = simRef.current;
    syncWheelVisuals(chassis, sim, wheelRefs.current);

    // Visual weight transfer — chassis mesh leans/pitches in the car's local frame.
    bodyGroup.rotation.set(sim.bodyPitch, 0, sim.bodyRoll);

    _vel.set(
      Math.sin(sim.velAngle) * sim.speedMs,
      0,
      Math.cos(sim.velAngle) * sim.speedMs,
    );
    updateVehicleTarget(chassis.translation(), chassis.rotation(), _vel);
    vehicleTarget.slip = wrapAngle(sim.heading - sim.velAngle);

    const elapsed = state.clock.elapsedTime;
    if (elapsed - lastTelemetryFlushRef.current >= TELEMETRY_FLUSH_INTERVAL) {
      const input = inputRef.current;
      const speedKmh = finiteOr(Math.abs(sim.speedMs) * 3.6, 0);
      const rpm = finiteOr(sim.engineRpm, VEHICLE_CONFIG.idleRpm);
      useTelemetryStore.getState().setSnapshot({
        speedKmh,
        rpm,
        gear: speedKmh > 43 ? 3 : speedKmh > 14 ? 2 : 1,
        throttle: finiteOr(input.throttle, 0),
        brake: finiteOr(input.brake, 0),
        steer: finiteOr(input.steer, 0),
        handbrake: input.handbrake,
        inputSource: inputSystem.getSource(),
      });
      lastTelemetryFlushRef.current = elapsed;
    }
  });

  return (
    <>
      <RigidBody
        ref={chassisRef}
        type="kinematicPosition"
        colliders="cuboid"
        args={VEHICLE_CONFIG.chassisHalfExtents}
        position={[
          spawnPose.position.x,
          spawnPose.position.y,
          spawnPose.position.z,
        ]}
        rotation={[0, spawnPose.rotationY, 0]}
      >
        <primitive object={bodyGroup} />
      </RigidBody>

      {VEHICLE_CONFIG.wheels.map((wheel, index) => (
        <primitive
          key={wheel.id}
          ref={(node: Object3D | null) => {
            wheelRefs.current[index] = node;
          }}
          object={wheelObjects[index] ?? wheelObjects[0]!}
          visible={false}
        />
      ))}
    </>
  );
}

function stepVehicle(
  chassis: RapierRigidBody,
  sim: VehicleSimState,
  input: InputState,
  restHeight: number,
  fallbackHeading: number,
): void {
  const cfg = VEHICLE_CONFIG;
  const dt = PHYSICS_TIMESTEP;
  const pos = chassis.translation();

  if (!Number.isFinite(pos.x) || !Number.isFinite(pos.z)) {
    return;
  }

  // --- Longitudinal: integrate signed speed (m/s) from accel/brake/drag. ---
  const driveAccel = (input.throttle * cfg.engineForce) / cfg.mass;
  const brakeAccel = (input.brake * cfg.brakeForce) / cfg.mass;
  const handbrakeAccel = input.handbrake
    ? (cfg.brakeForce * cfg.handbrakeMultiplier) / cfg.mass
    : 0;

  const speedBefore = finiteOr(sim.speedMs, 0);
  let speed = speedBefore;
  speed += driveAccel * dt;

  // Drag + rolling resistance always oppose current motion.
  const resist =
    ((cfg.drag * speed * speed) / cfg.mass +
      (cfg.rollingResistance * Math.abs(speed)) / cfg.mass) *
    dt;
  if (speed > 0) speed = Math.max(0, speed - resist);
  else if (speed < 0) speed = Math.min(0, speed + resist);

  // Brake decelerates toward 0, then engages reverse if held while stopped.
  if (brakeAccel > 0) {
    if (speed > 0.05) {
      speed = Math.max(0, speed - brakeAccel * dt);
    } else {
      speed = Math.max(-cfg.reverseMaxSpeedMs, speed - brakeAccel * dt * 0.5);
    }
  }

  // Handbrake: strong symmetric decel toward 0.
  if (handbrakeAccel > 0) {
    if (speed > 0) speed = Math.max(0, speed - handbrakeAccel * dt);
    else if (speed < 0) speed = Math.min(0, speed + handbrakeAccel * dt);
  }

  speed = clamp(finiteOr(speed, 0), -cfg.reverseMaxSpeedMs, cfg.maxSpeedMs);

  // --- Steering: smoothed wheel angle → yaw rate scaled by speed readiness. ---
  const targetSteer = input.steer * cfg.maxSteerAngle;
  sim.steerAngle = finiteOr(
    sim.steerAngle + (targetSteer - sim.steerAngle) * cfg.steerSpeed * dt,
    0,
  );

  const readiness = clamp(Math.abs(speed) / cfg.turnReadinessSpeed, 0, 1);
  const reverseSign = speed >= 0 ? 1 : -1;
  const headingBefore = finiteOr(sim.heading, fallbackHeading);
  let heading = headingBefore;
  // Negative: with forward = (sinθ, cosθ) and the chase cam looking down +Z,
  // steer-right (D / +1) must decrease yaw so the car turns toward screen-right.
  heading -= sim.steerAngle * readiness * cfg.turnRate * reverseSign * dt;
  const yawRate = dt > 0 ? wrapAngle(heading - headingBefore) / dt : 0;

  // --- Grip & drift: travel direction (velAngle) lags heading. ---
  const hnd = cfg.handling;
  let gripRate = input.handbrake ? hnd.gripHandbrake : hnd.gripBase;
  const corneringLoad = Math.abs(sim.steerAngle) * Math.abs(speed);
  gripRate *= clamp(1 - corneringLoad * hnd.gripLossPerLoad, hnd.minGripFactor, 1);
  const alignFactor = clamp(gripRate * dt, 0, 1);
  let velAngle = finiteOr(sim.velAngle, heading);
  velAngle += wrapAngle(heading - velAngle) * alignFactor;
  const slip = wrapAngle(heading - velAngle);
  // Sliding sideways scrubs speed (sense of grip loss).
  speed *= clamp(1 - Math.abs(slip) * hnd.slipScrub * dt, 0.92, 1);
  sim.speedMs = speed;
  sim.velAngle = finiteOr(velAngle, heading);

  // --- Position: advance along the travel direction, then clamp to the road. ---
  const fwdX = Math.sin(velAngle);
  const fwdZ = Math.cos(velAngle);
  let nx = pos.x + fwdX * speed * dt;
  let nz = pos.z + fwdZ * speed * dt;

  getRoadSurfaceAt(nx, nz, _surface);
  const lateral =
    (nx - _surface.point.x) * _surface.side.x +
    (nz - _surface.point.z) * _surface.side.z;
  const clampedLateral = clamp(lateral, -cfg.maxLateralOffset, cfg.maxLateralOffset);
  if (clampedLateral !== lateral) {
    nx = _surface.point.x + _surface.side.x * clampedLateral;
    nz = _surface.point.z + _surface.side.z * clampedLateral;

    // Hit the edge: trigger a crash sound + shake + speed scrub (rate-limited).
    const lateralSpeed = Math.abs(
      (fwdX * _surface.side.x + fwdZ * _surface.side.z) * speed,
    );
    if (impactCooldown <= 0 && lateralSpeed > 4) {
      const intensity = clamp(lateralSpeed / 25, 0.15, 1);
      playImpact(intensity);
      vehicleTarget.shake = Math.max(vehicleTarget.shake, intensity * 0.6);
      speed *= 1 - 0.5 * intensity;
      sim.speedMs = speed;
      impactCooldown = 24;
    }
  }
  if (impactCooldown > 0) impactCooldown--;
  const ny = _surface.y + restHeight;

  if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz) || !Number.isFinite(heading)) {
    // Should never happen with the guards above, but reset defensively.
    sim.heading = fallbackHeading;
    sim.speedMs = 0;
    return;
  }

  sim.heading = heading;

  // Drive the kinematic body — Rapier interpolates the render transform.
  chassis.setNextKinematicTranslation({ x: nx, y: ny, z: nz });
  _nextQuat.setFromAxisAngle(UP, heading);
  chassis.setNextKinematicRotation(_nextQuat);

  // --- Visual-only suspension + drivetrain bookkeeping. ---
  _chassisQuat.copy(_nextQuat);
  applyRaycastSuspension(chassis, _chassisQuat, sim.suspensionLengths, sim.wheelGrounded);

  const rpmTarget =
    cfg.idleRpm +
    input.throttle * (cfg.maxRpm - cfg.idleRpm) * clamp(Math.abs(speed) / 30, 0, 1);
  sim.engineRpm = finiteOr(
    sim.engineRpm + (rpmTarget - sim.engineRpm) * 8 * dt,
    cfg.idleRpm,
  );

  // --- Visual weight transfer (render only): squat/dive + body lean. ---
  const longAccel = dt > 0 ? (speed - speedBefore) / dt : 0;
  const latAccel = speed * yawRate;
  const targetPitch = clamp(-longAccel * hnd.pitchPerAccel, -hnd.maxBodyPitch, hnd.maxBodyPitch);
  const targetRoll = clamp(-latAccel * hnd.rollPerLat, -hnd.maxBodyRoll, hnd.maxBodyRoll);
  const tilt = clamp(hnd.tiltSmoothing * dt, 0, 1);
  sim.bodyPitch = finiteOr(sim.bodyPitch + (targetPitch - sim.bodyPitch) * tilt, 0);
  sim.bodyRoll = finiteOr(sim.bodyRoll + (targetRoll - sim.bodyRoll) * tilt, 0);

  const absSpeed = Math.abs(speed);
  cfg.wheels.forEach((wheel, i) => {
    if (wheel.isDrive && input.throttle > 0 && absSpeed < 0.2) {
      sim.wheelSpin[i] = (sim.wheelSpin[i] ?? 0) + input.throttle * 12 * dt;
    } else if (absSpeed > 0.05) {
      sim.wheelSpin[i] =
        (sim.wheelSpin[i] ?? 0) + (speed / wheel.radius) * dt;
    }
  });
}

function syncWheelVisuals(
  chassis: RapierRigidBody,
  sim: VehicleSimState,
  wheels: (Object3D | null)[],
): void {
  const pos = chassis.translation();
  const rot = chassis.rotation();
  _chassisQuat.set(rot.x, rot.y, rot.z, rot.w);
  _chassisDown.set(0, -1, 0).applyQuaternion(_chassisQuat).normalize();

  VEHICLE_CONFIG.wheels.forEach((wheel, index) => {
    const wheelObj = wheels[index];
    if (!wheelObj) return;

    wheelObj.visible = true;
    _wheelOffset.set(...wheel.position).applyQuaternion(_chassisQuat);

    const springLength =
      sim.suspensionLengths[index] ?? VEHICLE_CONFIG.suspension.restLength;

    wheelObj.position.set(
      pos.x + _wheelOffset.x + _chassisDown.x * springLength,
      pos.y + _wheelOffset.y + _chassisDown.y * springLength,
      pos.z + _wheelOffset.z + _chassisDown.z * springLength,
    );

    const steer = wheel.isSteer ? sim.steerAngle : 0;
    const spin = sim.wheelSpin[index] ?? 0;

    _steerQuat.setFromAxisAngle(UP, steer);
    _spinQuat.setFromAxisAngle(_spinAxis, spin);
    _wheelQuat.copy(_chassisQuat).multiply(_steerQuat).multiply(_spinQuat);
    wheelObj.quaternion.copy(_wheelQuat);
  });
}
