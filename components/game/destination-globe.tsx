"use client";

import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import { BackSide, type Group, SRGBColorSpace, Vector3 } from "three";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { useSceneStore } from "@/stores/scene-store";

/** Approximate real-world coordinates [lat, lon] for each destination. */
const COORDS: Record<string, [number, number]> = {
  acapulco: [16.86, -99.88],
  cancun: [21.16, -86.85],
  los_cabos: [22.89, -109.91],
  tulum: [20.21, -87.46],
  niza: [43.7, 7.27],
  monaco: [43.73, 7.42],
  costa_azul: [43.27, 6.64],
  positano: [40.63, 14.48],
  amalfi: [40.63, 14.6],
  portofino: [44.3, 9.21],
};

const R = 1;

function latLonToVec3(lat: number, lon: number, r: number): Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function GlobeScene() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const setSky = useSceneStore((s) => s.setSky);
  const [hover, setHover] = useState<number | null>(null);
  const spin = useRef<Group>(null);

  const earth = useTexture("/assets/third-party/textures/earth_2048.jpg");
  earth.colorSpace = SRGBColorSpace;

  const pins = useMemo(
    () =>
      SKY_PRESETS.map((p, i) => {
        const c = COORDS[p.id] ?? [0, 0];
        return { i, label: p.label, region: p.region, pos: latLonToVec3(c[0], c[1], R * 1.02) };
      }),
    [],
  );

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.07;
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 2, 5]} intensity={1.5} />

      {/* Axial tilt */}
      <group rotation={[0, 0, 0.41]}>
        <group ref={spin}>
          <mesh>
            <sphereGeometry args={[R, 64, 64]} />
            <meshStandardMaterial map={earth} roughness={0.85} metalness={0.05} />
          </mesh>

          {pins.map((pin) => {
            const active = pin.i === skyIndex;
            const mx = pin.region === "México";
            const color = active ? "#ffffff" : mx ? "#ffd27a" : "#9fd0ff";
            const emissive = active ? "#ffffff" : mx ? "#ff7a1a" : "#2f7bd0";
            return (
              <group key={pin.i} position={pin.pos}>
                <mesh
                  onClick={(e) => {
                    e.stopPropagation();
                    setSky(pin.i);
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHover(pin.i);
                  }}
                  onPointerOut={() => setHover(null)}
                >
                  <sphereGeometry args={[active ? 0.045 : 0.03, 12, 12]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={emissive}
                    emissiveIntensity={active ? 2.4 : 1.2}
                  />
                </mesh>
                {(active || hover === pin.i) && (
                  <Html center distanceFactor={6} style={{ pointerEvents: "none" }}>
                    <div className="globe-label">{pin.label}</div>
                  </Html>
                )}
              </group>
            );
          })}
        </group>
      </group>

      {/* Atmosphere glow */}
      <mesh scale={1.18}>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial color="#5aa0ff" transparent opacity={0.08} side={BackSide} />
      </mesh>

      <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.5} />
    </>
  );
}

/** Elegant rotating Earth to pick a destination by clicking its pin. */
export function DestinationGlobe() {
  return (
    <div className="globe-wrap">
      <Canvas camera={{ position: [0, 0.3, 3.0], fov: 40 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <GlobeScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
