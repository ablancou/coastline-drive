"use client";

import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { SPAWN_T } from "@/game/constants/spawn";
import { getTrack } from "@/game/constants/tracks";
import { getRoadCurve, setActiveTrack } from "@/game/procedural/geometry/road-path";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useSceneStore } from "@/stores/scene-store";

const VB = 100;

/** Top-down minimap of the circuit with a live marker for the car. */
export function Minimap() {
  const dotRef = useRef<SVGCircleElement>(null);
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const trackId = SKY_PRESETS[skyIndex % SKY_PRESETS.length]?.trackId ?? "stadium";

  const data = useMemo(() => {
    setActiveTrack(getTrack(trackId));
    const curve = getRoadCurve();
    const p = new Vector3();
    const pts: [number, number][] = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    const N = 160;
    for (let i = 0; i <= N; i++) {
      curve.getPoint(i / N, p);
      pts.push([p.x, p.z]);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const scale = (VB * 0.86) / Math.max(maxX - minX, maxZ - minZ);
    const project = (x: number, z: number): [number, number] => [
      VB / 2 + (x - cx) * scale,
      VB / 2 + (z - cz) * scale,
    ];
    const path =
      pts
        .map((pt, i) => `${i === 0 ? "M" : "L"}${project(pt[0], pt[1]).map((n) => n.toFixed(1)).join(" ")}`)
        .join(" ") + " Z";
    curve.getPoint(SPAWN_T, p);
    const start = project(p.x, p.z);
    return { path, project, start };
  }, [trackId]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (dotRef.current && vehicleTarget.active) {
        const [x, y] = data.project(vehicleTarget.position.x, vehicleTarget.position.z);
        dotRef.current.setAttribute("cx", x.toFixed(1));
        dotRef.current.setAttribute("cy", y.toFixed(1));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  return (
    <div className="minimap">
      <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%">
        <path d={data.path} className="minimap__track" />
        <circle cx={data.start[0]} cy={data.start[1]} r="2.6" className="minimap__start" />
        <circle ref={dotRef} cx="50" cy="50" r="3.2" className="minimap__car" />
      </svg>
    </div>
  );
}
