"use client";

import { useEffect, useRef, useState } from "react";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { useSceneStore } from "@/stores/scene-store";

/**
 * Press "N" to cycle the coastal sky preset. Shows a brief on-screen label of
 * the active beach. DOM-only shell component (not on the physics hot path).
 */
export function SkySwitcher() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const nextSky = useSceneStore((s) => s.nextSky);
  const [visible, setVisible] = useState(false);
  const firstRender = useRef(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyN") nextSky(SKY_PRESETS.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextSky]);

  // Flash the label whenever the sky changes (skip the initial mount).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 2200);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [skyIndex]);

  const preset = SKY_PRESETS[skyIndex % SKY_PRESETS.length] ?? SKY_PRESETS[0]!;

  return (
    <div className={`sky-toast${visible ? " sky-toast--on" : ""}`} aria-hidden={!visible}>
      <span className="sky-toast__eyebrow">ESCENARIO · N</span>
      <span className="sky-toast__label">{preset.label}</span>
    </div>
  );
}
