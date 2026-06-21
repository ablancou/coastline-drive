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

const COUNT = 5;
const COLORS = [0xdedede, 0x2b6cb0, 0x2f855a, 0xb7791f, 0x9b2c2c];

interface TrafficCar {
  group: Object3D;
  t: number;
  speed: number; // progress per second (fraction of lap)
  lane: number; // lateral offset
}

/** Lightweight cars cruising the circuit on a side lane — ambient traffic. */
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
      cars.push({
        group: car,
        t: i / COUNT,
        speed: 0.02 + (i % 3) * 0.004,
        lane: (i % 2 === 0 ? -1 : 1) * (ROAD_WIDTH * 0.25),
      });
    }
    carsRef.current = cars;
    return g;
  }, []);

  useFrame((_, dt) => {
    for (const car of carsRef.current) {
      car.t = (car.t + car.speed * dt) % 1;
      sampleRoadFrame(car.t, frame);
      const x = frame.point.x + frame.side.x * car.lane;
      const z = frame.point.z + frame.side.z * car.lane;
      car.group.position.set(x, restHeight - 0.2, z);
      car.group.rotation.y = Math.atan2(frame.tangent.x, frame.tangent.z);
    }
  });

  return <primitive object={root} />;
}
