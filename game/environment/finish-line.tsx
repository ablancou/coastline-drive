"use client";

import { useMemo } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import { ROAD_SURFACE_Y, ROAD_WIDTH, sampleRoadFrame } from "@/game/procedural/geometry/road-path";
import { createCheckerTexture } from "@/game/procedural/textures/checker";
import { FINISH_T } from "@/game/systems/lap-system";

/**
 * Checkered finish gate at the end of the sprint: a checker strip painted across
 * the road plus two posts and an overhead banner — a clear "you're racing to
 * HERE" goal. Built once from the active road spline.
 */
export function FinishLine() {
  const group = useMemo(() => {
    const g = new Group();
    const frame = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };
    sampleRoadFrame(FINISH_T, frame);

    const px = frame.point.x;
    const pz = frame.point.z;
    // Same convention the cars use: local +Z faces along the tangent, so the
    // gate's local +X (width) spans across the road.
    const yaw = Math.atan2(frame.tangent.x, frame.tangent.z);

    const checkerGround = createCheckerTexture(10);
    checkerGround.repeat.set(6, 1.4);
    const checkerBanner = createCheckerTexture(8);
    checkerBanner.repeat.set(10, 2);

    const post = new CylinderGeometry(0.16, 0.18, 6.4, 12);
    const postMat = new MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.5, metalness: 0.1 });
    const half = ROAD_WIDTH * 0.5 + 0.6;

    // Two posts, one each side of the road.
    for (const s of [-1, 1] as const) {
      const p = new Mesh(post, postMat);
      p.position.set(px + frame.side.x * s * half, ROAD_SURFACE_Y + 3.2, pz + frame.side.z * s * half);
      p.castShadow = true;
      g.add(p);
    }

    // Overhead checkered banner spanning the road.
    const banner = new Mesh(
      new BoxGeometry(ROAD_WIDTH + 1.6, 1.1, 0.18),
      new MeshStandardMaterial({ map: checkerBanner, roughness: 0.6, side: DoubleSide }),
    );
    banner.position.set(px, ROAD_SURFACE_Y + 6.0, pz);
    banner.rotation.y = yaw;
    banner.castShadow = true;
    g.add(banner);

    // Checker strip painted flat across the road surface (thin box → top face
    // shows the checker; avoids plane-rotation ordering issues).
    const strip = new Mesh(
      new BoxGeometry(ROAD_WIDTH, 0.04, 2.2),
      new MeshStandardMaterial({ map: checkerGround, roughness: 0.7, side: DoubleSide }),
    );
    strip.position.set(px, ROAD_SURFACE_Y + 0.07, pz);
    strip.rotation.y = yaw;
    g.add(strip);

    return g;
  }, []);

  return <primitive object={group} />;
}
