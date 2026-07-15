"use client";

import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import {
  CircleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  type Object3D,
} from "three";
import { VEHICLE_CONFIG } from "@/game/constants/vehicle";
import { createCarBody } from "@/game/procedural/geometry/car-designs";
import { createDog, DOG_SEATS, dogPose } from "@/game/procedural/geometry/dog";
import { createWheelMesh } from "@/game/procedural/geometry/wheel";
import { useCustomizationStore } from "@/stores/customization-store";

/** Assembled show car (body + wheels + driver + dogs) from the current config. */
function buildShowCar(
  carId: string,
  carColor: string,
  wheelColor: string,
  driver: "man" | "woman",
  dogCount: number,
  dogColor: string,
  dogSize: "chico" | "grande",
): Object3D {
  const car = createCarBody(carId, carColor);
  const man = car.userData.driverMan as Object3D | undefined;
  const woman = car.userData.driverWoman as Object3D | undefined;
  if (man) man.visible = driver === "man";
  if (woman) woman.visible = driver === "woman";

  const wheelY = -VEHICLE_CONFIG.suspension.restLength;
  for (const w of VEHICLE_CONFIG.wheels) {
    const wheel = createWheelMesh(w.radius, wheelColor);
    wheel.position.set(w.position[0], w.position[1] + wheelY, w.position[2]);
    car.add(wheel);
  }

  for (let i = 0; i < Math.min(dogCount, DOG_SEATS.length); i++) {
    const dog = createDog(dogColor);
    const pose = dogPose(i, dogSize);
    dog.position.set(...DOG_SEATS[i]!);
    dog.scale.setScalar(pose.scale);
    dog.rotation.y = pose.yaw;
    car.add(dog);
  }
  return car;
}

function Turntable() {
  const spin = useRef<Group>(null);
  const carId = useCustomizationStore((s) => s.carId);
  const carColor = useCustomizationStore((s) => s.carColor);
  const wheelColor = useCustomizationStore((s) => s.wheelColor);
  const driver = useCustomizationStore((s) => s.driver);
  const dogCount = useCustomizationStore((s) => s.dogCount);
  const dogColor = useCustomizationStore((s) => s.dogColor);
  const dogSize = useCustomizationStore((s) => s.dogSize);

  // Menu context — a full rebuild per config change is cheap and simplest.
  const car = useMemo(
    () => buildShowCar(carId, carColor, wheelColor, driver, dogCount, dogColor, dogSize),
    [carId, carColor, wheelColor, driver, dogCount, dogColor, dogSize],
  );

  // Ground level relative to the chassis center, straight from the config.
  const groundY = useMemo(() => {
    const w0 = VEHICLE_CONFIG.wheels[0]!;
    return w0.position[1] - VEHICLE_CONFIG.suspension.restLength - w0.radius;
  }, []);

  const podium = useMemo(() => {
    const g = new Group();
    const disc = new Mesh(
      new CircleGeometry(2.6, 48),
      new MeshStandardMaterial({ color: 0x11161d, roughness: 0.9 }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = groundY - 0.01;
    g.add(disc);
    const ring = new Mesh(
      new RingGeometry(2.45, 2.6, 48),
      new MeshBasicMaterial({ color: 0x5b9bff, transparent: true, opacity: 0.55 }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = groundY;
    g.add(ring);
    return g;
  }, [groundY]);

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.4;
  });

  return (
    <group position={[0, -groundY * 0.5, 0]}>
      <group ref={spin}>
        <primitive object={car} />
      </group>
      <primitive object={podium} />
    </group>
  );
}

/** Live 3D configurator preview — the car on a slow turntable, drag to orbit. */
export function CarPreview() {
  return (
    <div className="car-preview">
      <Canvas camera={{ position: [3.1, 1.5, 3.4], fov: 34 }} dpr={[1, 2]} shadows={false}>
        <Suspense fallback={null}>
          <hemisphereLight args={["#dcecff", "#20242c", 0.55]} />
          <directionalLight position={[4, 6, 3]} intensity={1.6} color="#fff2dd" />
          <directionalLight position={[-5, 3, -4]} intensity={0.5} color="#9fc4ff" />
          {/* Procedural studio IBL — crisp reflections on paint + chrome. */}
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={3} position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
            <Lightformer form="rect" intensity={1.2} position={[-5, 1, -1]} scale={[3, 6, 1]} rotation-y={Math.PI / 2} />
            <Lightformer form="rect" intensity={1} position={[5, 1, -1]} scale={[3, 6, 1]} rotation-y={-Math.PI / 2} />
          </Environment>
          <Turntable />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={0.7}
            maxPolarAngle={1.45}
            rotateSpeed={0.6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
