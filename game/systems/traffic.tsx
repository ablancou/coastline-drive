"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BoxGeometry,
  type Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { getChassisRestHeightAboveRoad } from "@/game/constants/spawn";
import { ROAD_WIDTH, sampleRoadFrame } from "@/game/procedural/geometry/road-path";
import { useRaceStore } from "@/stores/race-store";

const COUNT = 7;
const COLORS = [0xe6e8ea, 0x2b6cb0, 0x2f855a, 0xb7791f, 0x9b2c2c, 0x394a5a, 0xcabf4a];

interface TrafficCar {
  group: Object3D;
  wheels: Mesh[];
  t: number;
  speed: number; // progress per second (fraction of the road)
  lane: number; // lateral offset
  dir: 1 | -1; // +1 same direction as the player, -1 oncoming
}

/**
 * Ambient traffic cruising the coastal highway: mostly oncoming cars on the far
 * lane (they whoosh past the other way) plus a couple of slower same-direction
 * cars to overtake. Purely cosmetic — no collision (that's the rivals' job).
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
      // First two cars run with the player (slower — overtake fodder); rest oncoming.
      const dir: 1 | -1 = i < 2 ? 1 : -1;
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
      // Greenhouse glass.
      const glass = new Mesh(new BoxGeometry(1.52, 0.4, 1.5), glassMat);
      glass.position.set(0, 0.54, -0.1);
      car.add(glass);

      // Lights: white at the +Z end, red at the −Z end (local frame).
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
        t: (i / COUNT + 0.03) % 1,
        speed: dir === 1 ? 0.012 + (i % 2) * 0.004 : 0.03 + (i % 3) * 0.006,
        lane: dir * (ROAD_WIDTH * 0.26),
        dir,
      });
    }
    carsRef.current = cars;
    return g;
  }, []);

  useFrame((_, dt) => {
    const race = useRaceStore.getState();
    const rolling = race.started && !race.paused && !race.finished;

    for (const car of carsRef.current) {
      if (rolling) car.t = (car.t + car.dir * car.speed * dt + 1) % 1;
      sampleRoadFrame(car.t, frame);
      const x = frame.point.x + frame.side.x * car.lane;
      const z = frame.point.z + frame.side.z * car.lane;
      car.group.position.set(x, restHeight - 0.18, z);
      // Face travel direction (flip 180° for oncoming cars).
      const heading = Math.atan2(frame.tangent.x, frame.tangent.z);
      car.group.rotation.y = car.dir === 1 ? heading : heading + Math.PI;
      // Roll the wheels for a touch of life.
      if (rolling) {
        const spin = car.speed * 90 * dt;
        for (const w of car.wheels) w.rotation.x += spin;
      }
    }
  });

  return <primitive object={root} />;
}
