"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { BackSide, Vector3 } from "three";
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

  const pins = useMemo(
    () =>
      SKY_PRESETS.map((p, i) => {
        const c = COORDS[p.id] ?? [0, 0];
        return { i, label: p.label, region: p.region, pos: latLonToVec3(c[0], c[1], R * 1.02) };
      }),
    [],
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 2, 4]} intensity={1.3} />

      {/* Ocean sphere */}
      <mesh>
        <sphereGeometry args={[R, 48, 48]} />
        <meshStandardMaterial color="#11476b" roughness={0.75} metalness={0.1} />
      </mesh>
      {/* Lat/long wire */}
      <mesh scale={1.004}>
        <sphereGeometry args={[R, 24, 16]} />
        <meshBasicMaterial color="#3a7bb0" wireframe transparent opacity={0.22} />
      </mesh>
      {/* Atmosphere glow */}
      <mesh scale={1.16}>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial color="#6fb3ff" transparent opacity={0.06} side={BackSide} />
      </mesh>

      {pins.map((pin) => {
        const active = pin.i === skyIndex;
        const mx = pin.region === "México";
        const color = active ? "#ffffff" : mx ? "#ffb347" : "#6fb3ff";
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
              <sphereGeometry args={[active ? 0.05 : 0.034, 12, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={active ? 2.2 : 1.1}
              />
            </mesh>
            {(active || hover === pin.i) && (
              <Html center distanceFactor={5.5} style={{ pointerEvents: "none" }}>
                <div className="globe-label">{pin.label}</div>
              </Html>
            )}
          </group>
        );
      })}

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.55} rotateSpeed={0.5} />
    </>
  );
}

/** Rotating 3D globe to pick a destination by clicking its pin. */
export function DestinationGlobe() {
  return (
    <div className="globe-wrap">
      <Canvas camera={{ position: [0, 0.4, 3.1], fov: 42 }} dpr={[1, 2]}>
        <GlobeScene />
      </Canvas>
    </div>
  );
}
