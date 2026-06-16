"use client";

import { CAR_COLORS } from "@/game/constants/customization";
import { startEngineAudio } from "@/game/procedural/audio/engine-audio";
import { useCustomizationStore } from "@/stores/customization-store";

interface StartScreenProps {
  onStart: () => void;
}

/**
 * Title / start overlay. The "DRIVE" click is the user gesture that unlocks the
 * Web Audio engine (browser autoplay policy) and reveals the running scene.
 */
export function StartScreen({ onStart }: StartScreenProps) {
  const { carColor, driver, setCarColor, setDriver } = useCustomizationStore();

  const handleStart = () => {
    startEngineAudio();
    onStart();
  };

  return (
    <div className="start" role="dialog" aria-label="Coastline Drive — start">
      <div className="start__inner">
        <span className="start__tag">PROTOTYPE · WORK IN PROGRESS</span>
        <h1 className="start__title">COASTLINE</h1>
        <h2 className="start__subtitle">DRIVE</h2>
        <p className="start__tagline">
          A procedural coastal-highway racer — built in code, no external assets.
        </p>

        <div className="custom">
          <div className="custom__group">
            <span className="custom__label">COLOR</span>
            <div className="custom__swatches">
              {CAR_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`swatch${carColor === c.hex ? " swatch--active" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setCarColor(c.hex)}
                  aria-label={c.label}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="custom__group">
            <span className="custom__label">PILOTO</span>
            <div className="custom__toggle">
              <button
                type="button"
                className={`pill${driver === "man" ? " pill--active" : ""}`}
                onClick={() => setDriver("man")}
              >
                Hombre
              </button>
              <button
                type="button"
                className={`pill${driver === "woman" ? " pill--active" : ""}`}
                onClick={() => setDriver("woman")}
              >
                Mujer
              </button>
            </div>
          </div>
        </div>

        <button className="start__cta" onClick={handleStart} autoFocus>
          START
        </button>

        <div className="start__controls">
          <span><b>W</b> / <b>RT</b> throttle</span>
          <span><b>S</b> / <b>LT</b> brake · reverse</span>
          <span><b>A</b> <b>D</b> steer</span>
          <span><b>Space</b> handbrake / drift</span>
          <span><b>N</b> cambiar playa</span>
          <span><b>M</b> mute</span>
        </div>
      </div>
    </div>
  );
}
