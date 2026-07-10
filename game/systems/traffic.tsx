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
import { ROAD_WIDTH, sampleRoadFrame } from "@/game/procedural/geometry/road-path";
import { trafficPositions } from "@/game/systems/rival-state";
import { useRaceStore } from "@/stores/race-store";

const COUNT = 4;
const COLORS = [0xe6e8ea, 0x2b6cb0, 0xb7791f, 0x394a5a];

interface TrafficCar {
  group: Object3D;
  wheels: Mesh[];
  t: number;
  speed: number; // progress per second (fraction of the road)
  lane: number; // lateral offset
}

/**
 * Ambient traffic: a few SLOW cars cruising the player's direction — moving
 * obstacles to overtake, never oncoming ghosts. They register their positions
 * so the player's soft-collision treats them as solid.
 */
export function Traffic() {
  const restHeight = useMemo(() => getChassisRestHeightAboveRoad(), []);
  const carsRef = useRef<TrafficCar[]>([]);
  const frame = useMemo(
    () => ({ point: new Vector3(), tangent: new Vector3(), side: new Vector3() }),
    [],
  );

  const root = useMemo(() => {
    const g = new Object3D();
    const cars: TrafficCar[] = [];
    const bodyGeo = new BoxGeometry(1.7, 0.42, 3.7);
    const cabinGeo = new BoxGeometry(1.5, 0.5, 1.9);
    const wheelGeo = new BoxGeometry(0.34, 0.62, 0.62);
    const wheelMat = new MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9 });
    const glassMat = new MeshStandardMaterial({ color: 0x1a2530, roughness: 0.25, metalness: 0.3 });
    const headMat = new MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cf, emissiveIntensity: 2, roughness: 0.3 });
    const tailMat = new MeshStandardMaterial({ color: 0x3a0508, emissive: 0xff2233, emissiveIntensity: 2.2, roughness: 0.4 });

    for (let i = 0; i < COUNT; i++) {
      const car = new Object3D();
      const paint = new MeshStandardMaterial({
        color: COLORS[i % COLORS.length],
        metalness: 0.55,
        roughness: 0.38,
      });
      const body = new Mesh(bodyGeo, paint);
      body.position.y = 0.12;
      body.castShadow = true;
      car.add(body);
      const cabin = new Mesh(cabinGeo, paint);
      cabin.position.set(0, 0.52, -0.15);
      car.add(cabin);
      const glass = new Mesh(new BoxGeometry(1.52, 0.4, 1.5), glassMat);
      glass.position.set(0, 0.54, -0.1);
      car.add(glass);

      // Lights: white nose, red tail (local +Z faces forward).
      for (const sx of [-0.55, 0.55]) {
        const h = new Mesh(new BoxGeometry(0.28, 0.14, 0.06), headMat);
        h.position.set(sx, 0.14, 1.86);
        car.add(h);
        const tl = new Mesh(new BoxGeometry(0.3, 0.14, 0.06), tailMat);
        tl.position.set(sx, 0.16, -1.86);
        car.add(tl);
      }

      const wheels: Mesh[] = [];
      for (const [wx, wz] of [
        [-0.86, 1.2],
        [0.86, 1.2],
        [-0.86, -1.2],
        [0.86, -1.2],
      ] as const) {
        const w = new Mesh(wheelGeo, wheelMat);
        w.position.set(wx, -0.16, wz);
        car.add(w);
        wheels.push(w);
      }
      g.add(car);
      cars.push({
        group: car,
        wheels,
        // Spread ahead of the player's spawn so they appear as traffic to catch.
        t: 0.16 + i * 0.18,
        speed: 0.009 + (i % 2) * 0.003, // cruisers — much slower than the race
        lane: (i % 2 === 0 ? -1 : 1) * (ROAD_WIDTH * 0.22),
      });
      trafficPositions[i] = { x: 0, z: 0 };
    }
    carsRef.current = cars;
    return g;
  }, []);

  useFrame((_, dt) => {
    const race = useRaceStore.getState();
    const rolling = race.started && !race.paused && !race.finished;

    carsRef.current.forEach((car, i) => {
      if (rolling) car.t = Math.min(1, car.t + car.speed * dt); // park at the end
      sampleRoadFrame(car.t, frame);
      const x = frame.point.x + frame.side.x * car.lane;
      const z = frame.point.z + frame.side.z * car.lane;
      car.group.position.set(x, restHeight - 0.18, z);
      car.group.rotation.y = Math.atan2(frame.tangent.x, frame.tangent.z);
      if (rolling && car.t < 1) {
        const spin = car.speed * 90 * dt;
        for (const w of car.wheels) w.rotation.x += spin;
      }
      const slot = trafficPositions[i];
      if (slot) {
        slot.x = x;
        slot.z = z;
      }
    });
  });

  return <primitive object={root} />;
}
