"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { getChassisRestHeightAboveRoad } from "@/game/constants/spawn";
import {
  getRoadProgress,
  ROAD_WIDTH,
  sampleRoadFrame,
} from "@/game/procedural/geometry/road-path";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";

const COUNT = 5;
const COLORS = [0xdedede, 0x2b6cb0, 0x2f855a, 0xb7791f, 0x9b2c2c];

interface Rival {
  group: Object3D;
  t: number;
  laps: number;
  speed: number; // laps per second
  lane: number;
}

/** Rival cars racing the circuit; computes the player's live standing. */
export function Rivals() {
  const restHeight = useMemo(() => getChassisRestHeightAboveRoad(), []);
  const rivalsRef = useRef<Rival[]>([]);
  const frame = useMemo(
    () => ({ point: new Vector3(), tangent: new Vector3(), side: new Vector3() }),
    [],
  );

  const root = useMemo(() => {
    const g = new Object3D();
    const rivals: Rival[] = [];
    const bodyGeo = new BoxGeometry(1.7, 0.5, 3.6);
    const cabinGeo = new BoxGeometry(1.4, 0.45, 1.7);
    const wheelGeo = new BoxGeometry(0.3, 0.6, 0.6);
    const wheelMat = new MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9 });

    for (let i = 0; i < COUNT; i++) {
      const car = new Object3D();
      const paint = new MeshStandardMaterial({
        color: COLORS[i % COLORS.length],
        metalness: 0.5,
        roughness: 0.4,
      });
      const body = new Mesh(bodyGeo, paint);
      body.position.y = 0.1;
      body.castShadow = true;
      car.add(body);
      const cabin = new Mesh(cabinGeo, paint);
      cabin.position.set(0, 0.5, -0.2);
      car.add(cabin);
      for (const [wx, wz] of [
        [-0.85, 1.2],
        [0.85, 1.2],
        [-0.85, -1.2],
        [0.85, -1.2],
      ] as const) {
        const w = new Mesh(wheelGeo, wheelMat);
        w.position.set(wx, -0.2, wz);
        car.add(w);
      }
      g.add(car);
      rivals.push({
        group: car,
        t: 0.02 + i * 0.012, // staggered grid
        laps: 0,
        speed: 0.026 + (i % 3) * 0.0025, // competitive pace
        lane: (i % 2 === 0 ? -1 : 1) * (ROAD_WIDTH * 0.16),
      });
    }
    rivalsRef.current = rivals;
    return g;
  }, []);

  useFrame((_, dt) => {
    const race = useRaceStore.getState();
    const live = race.started && !race.paused && !race.finished;

    for (const r of rivalsRef.current) {
      if (live) {
        const nt = r.t + r.speed * dt;
        if (nt >= 1) r.laps += 1;
        r.t = nt % 1;
      }
      sampleRoadFrame(r.t, frame);
      const x = frame.point.x + frame.side.x * r.lane;
      const z = frame.point.z + frame.side.z * r.lane;
      r.group.position.set(x, restHeight - 0.2, z);
      r.group.rotation.y = Math.atan2(frame.tangent.x, frame.tangent.z);
    }

    // Live standing: compare total progress (laps + lap fraction).
    if (vehicleTarget.active) {
      const playerLaps = useLapStore.getState().lapCount;
      const playerProgress = playerLaps + getRoadProgress(vehicleTarget.position.x, vehicleTarget.position.z);
      let ahead = 0;
      for (const r of rivalsRef.current) {
        if (r.laps + r.t > playerProgress) ahead++;
      }
      race.setStanding(ahead + 1, COUNT + 1);
    }
  });

  return <primitive object={root} />;
}
