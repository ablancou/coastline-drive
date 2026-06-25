"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { CAR_DESIGNS } from "@/game/constants/cars";
import { getChassisRestHeightAboveRoad } from "@/game/constants/spawn";
import { VEHICLE_CONFIG } from "@/game/constants/vehicle";
import { createCarBody } from "@/game/procedural/geometry/car-designs";
import {
  getRoadProgress,
  ROAD_WIDTH,
  sampleRoadFrame,
} from "@/game/procedural/geometry/road-path";
import { rivalPositions } from "@/game/systems/rival-state";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useRaceStore } from "@/stores/race-store";

const COUNT = 4;
const COLORS = ["#dedede", "#2b6cb0", "#2f855a", "#b7791f", "#9b2c2c", "#5b2a86"];

interface Rival {
  group: Object3D;
  t: number;
  laps: number;
  speed: number; // laps per second
  lane: number;
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

    for (let i = 0; i < COUNT; i++) {
      const car = new Object3D();
      const design = CAR_DESIGNS[i % CAR_DESIGNS.length]!;
      const body = createCarBody(design.id, COLORS[i % COLORS.length]!, false);
      car.add(body);
      for (const w of VEHICLE_CONFIG.wheels) {
        const wheel = new Mesh(wheelGeo, wheelMat);
        wheel.position.set(w.position[0], wheelY, w.position[2]);
        wheel.castShadow = true;
        car.add(wheel);
      }
      g.add(car);
      rivals.push({
        group: car,
        t: 0.01 + i * 0.012,
        laps: 0,
        speed: 0.05 + (i % 3) * 0.013, // reaches the finish in ~13-20s
        lane: (i % 2 === 0 ? -1 : 1) * (ROAD_WIDTH * 0.16),
      });
      rivalPositions[i] = { x: 0, z: 0 };
    }
    rivalsRef.current = rivals;
    return g;
  }, []);

  useFrame((_, dt) => {
    const race = useRaceStore.getState();
    if (race.timeTrial) {
      rivalPositions.length = 0; // no rivals → no collision
      return;
    }
    const live = race.started && !race.paused && !race.finished;

    rivalsRef.current.forEach((r, i) => {
      if (live) {
        r.t = Math.min(1, r.t + r.speed * dt); // drive to the finish, then stop
      }
      sampleRoadFrame(r.t, frame);
      const x = frame.point.x + frame.side.x * r.lane;
      const z = frame.point.z + frame.side.z * r.lane;
      r.group.position.set(x, restHeight, z);
      r.group.rotation.y = Math.atan2(frame.tangent.x, frame.tangent.z);
      const slot = rivalPositions[i];
      if (slot) {
        slot.x = x;
        slot.z = z;
      }
    });

    if (vehicleTarget.active) {
      const playerProgress = getRoadProgress(vehicleTarget.position.x, vehicleTarget.position.z);
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
