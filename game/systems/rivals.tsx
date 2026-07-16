"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { CAR_DESIGNS } from "@/game/constants/cars";
import { getChassisRestHeightAboveRoad, SPAWN_T } from "@/game/constants/spawn";
import { VEHICLE_CONFIG } from "@/game/constants/vehicle";
import { createCarBody } from "@/game/procedural/geometry/car-designs";
import {
  getLateralOffsetFromRoad,
  getRoadCurve,
  getRoadInteriorSign,
  getRoadProgress,
  ROAD_WIDTH,
  sampleRoadFrame,
} from "@/game/procedural/geometry/road-path";
import { rivalPositions, trafficPositions } from "@/game/systems/rival-state";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useRaceStore } from "@/stores/race-store";

const COUNT = 4;
const COLORS = ["#dedede", "#2b6cb0", "#2f855a", "#b7791f", "#9b2c2c", "#5b2a86"];
/** Minimum nose-to-tail gap (m) enforced between cars sharing a lane. */
const MIN_GAP = 5.5;
/** Cars closer than this laterally (m) are considered "in the same lane". */
const LANE_CLEARANCE = 2.4;
/** Staggered grid ahead of the player: rivals launch away, never through you. */
const gridT = (i: number): number => SPAWN_T + 0.0035 * (i + 1);

interface Rival {
  group: Object3D;
  body: Object3D;
  wheels: Mesh[];
  t: number;
  laps: number;
  speed: number; // laps per second
  lane: number;
  prevYaw: number;
  roll: number;
  /** Launch ramp 0→1 — rivals accelerate off the line like the player does. */
  ramp: number;
}

export function Rivals() {
  const timeTrial = useRaceStore((s) => s.timeTrial);
  const restHeight = useMemo(() => getChassisRestHeightAboveRoad(), []);
  const rivalsRef = useRef<Rival[]>([]);
  const frame = useMemo(
    () => ({ point: new Vector3(), tangent: new Vector3(), side: new Vector3() }),
    [],
  );

  const root = useMemo(() => {
    const g = new Object3D();
    const rivals: Rival[] = [];
    const wheelGeo = new CylinderGeometry(0.36, 0.36, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9 });
    const wheelY = VEHICLE_CONFIG.wheels[0]!.position[1] - VEHICLE_CONFIG.suspension.restLength;

    const roadLen = getRoadCurve().getLength();
    for (let i = 0; i < COUNT; i++) {
      const car = new Object3D();
      const design = CAR_DESIGNS[i % CAR_DESIGNS.length]!;
      // Rivals carry a driver too — alternating man/woman down the grid.
      const body = createCarBody(design.id, COLORS[i % COLORS.length]!, true);
      const man = body.userData.driverMan as Object3D | undefined;
      const woman = body.userData.driverWoman as Object3D | undefined;
      if (man) man.visible = i % 2 === 0;
      if (woman) woman.visible = i % 2 === 1;
      car.add(body);
      const wheels: Mesh[] = [];
      for (const w of VEHICLE_CONFIG.wheels) {
        const wheel = new Mesh(wheelGeo, wheelMat);
        wheel.position.set(w.position[0], wheelY, w.position[2]);
        wheel.castShadow = true;
        car.add(wheel);
        wheels.push(wheel);
      }
      g.add(car);
      const lane = (i % 2 === 0 ? -1 : 1) * (ROAD_WIDTH * 0.16);
      rivals.push({
        group: car,
        body,
        wheels,
        t: gridT(i),
        laps: 0,
        // Real pace in m/s (~26-32) converted to track fraction/s — identical
        // feel regardless of road length; rubber-banding keeps the pack close.
        speed: (26 + (i % 3) * 3) / roadLen,
        lane,
        prevYaw: 0,
        roll: 0,
        ramp: 0,
      });
      rivalPositions[i] = { x: 0, z: 0, t: gridT(i), lane };
    }
    rivalsRef.current = rivals;
    return g;
  }, []);

  // Road length (m) → converts t-speed to linear speed for wheel spin.
  const roadLength = useMemo(() => getRoadCurve().getLength(), []);

  // Fresh run (REINICIAR / mode change): rivals return to the grid.
  const runId = useRaceStore((s) => s.runId);
  useEffect(() => {
    rivalsRef.current.forEach((r, i) => {
      r.t = gridT(i);
      r.ramp = 0;
      r.roll = 0;
      r.prevYaw = 0;
    });
  }, [runId]);

  useFrame((state, dt) => {
    const race = useRaceStore.getState();
    if (race.timeTrial) {
      rivalPositions.length = 0; // no rivals → no collision
      return;
    }
    const live = race.started && !race.paused && !race.finished;

    const elapsed = state.clock.elapsedTime;
    const playerProgress = vehicleTarget.active
      ? getRoadProgress(vehicleTarget.position.x, vehicleTarget.position.z)
      : 0;

    // --- Pass 1: advance every rival along the road. ---
    for (const r of rivalsRef.current) {
      if (!live) continue;
      // Launch ramp: rivals accelerate off the line over ~5s (fair start).
      r.ramp = Math.min(1, r.ramp + dt / 5);
      const launch = r.ramp * r.ramp * (3 - 2 * r.ramp); // smoothstep

      // Rubber-banding: leaders ease off, stragglers push — the pack stays
      // close enough to fight without ever being unbeatable.
      const gap = r.t - playerProgress;
      const band = Math.min(1.12, Math.max(0.78, 1 - gap * 3));

      r.t = Math.min(1, r.t + r.speed * launch * band * dt);
    }

    // --- Pass 2: separation — no car may occupy another car's space. A car
    // approaching an obstacle in its lane (another rival, ambient traffic, or
    // the PLAYER) queues behind it instead of ghosting through. ---
    if (live) {
      const minGapT = MIN_GAP / roadLength;
      const playerLane = vehicleTarget.active
        ? getLateralOffsetFromRoad(vehicleTarget.position.x, vehicleTarget.position.z) *
          getRoadInteriorSign()
        : 0;
      for (const r of rivalsRef.current) {
        // vs other rivals (only yield to cars ahead).
        for (const o of rivalsRef.current) {
          if (o === r) continue;
          if (Math.abs(o.lane - r.lane) >= LANE_CLEARANCE) continue;
          const ahead = o.t - r.t;
          if (ahead > 0 && ahead < minGapT) r.t = o.t - minGapT;
        }
        // vs ambient traffic.
        for (const tp of trafficPositions) {
          if (Math.abs(tp.lane - r.lane) >= LANE_CLEARANCE) continue;
          const ahead = tp.t - r.t;
          if (ahead > 0 && ahead < minGapT) r.t = tp.t - minGapT;
        }
        // vs the player — rivals brake behind you, never through you.
        if (vehicleTarget.active && Math.abs(playerLane - r.lane) < LANE_CLEARANCE) {
          const ahead = playerProgress - r.t;
          if (ahead > 0 && ahead < minGapT) r.t = playerProgress - minGapT;
        }
      }
    }

    // --- Pass 3: place visuals + publish collision slots. ---
    rivalsRef.current.forEach((r, i) => {
      sampleRoadFrame(r.t, frame);
      const x = frame.point.x + frame.side.x * r.lane;
      const z = frame.point.z + frame.side.z * r.lane;
      r.group.position.set(x, restHeight, z);
      const yaw = Math.atan2(frame.tangent.x, frame.tangent.z);
      r.group.rotation.y = yaw;

      // Life: wheels spin with linear speed; body banks into curves + soft bob.
      const moving = live && r.t < 1;
      if (moving && dt > 0) {
        const linSpeed = r.speed * roadLength; // m/s
        const spin = (linSpeed / 0.36) * dt;
        for (const w of r.wheels) w.rotation.x += spin;

        let dYaw = yaw - r.prevYaw;
        if (dYaw > Math.PI) dYaw -= Math.PI * 2;
        else if (dYaw < -Math.PI) dYaw += Math.PI * 2;
        const targetRoll = Math.max(-0.09, Math.min(0.09, (-dYaw / dt) * 0.03));
        r.roll += (targetRoll - r.roll) * Math.min(1, 6 * dt);
      } else {
        r.roll += (0 - r.roll) * Math.min(1, 6 * dt);
      }
      r.prevYaw = yaw;
      r.body.rotation.z = r.roll;
      r.body.position.y = moving ? Math.sin(elapsed * 9 + i * 2.1) * 0.012 : 0;

      const slot = rivalPositions[i];
      if (slot) {
        slot.x = x;
        slot.z = z;
        slot.t = r.t;
        slot.lane = r.lane;
      }
    });

    if (vehicleTarget.active) {
      let ahead = 0;
      for (const r of rivalsRef.current) {
        if (r.t > playerProgress) ahead++;
      }
      race.setStanding(ahead + 1, COUNT + 1);
    }
  });

  if (timeTrial) return null;
  return <primitive object={root} />;
}
