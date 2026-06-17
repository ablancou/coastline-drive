"use client";

import { SiteFooter } from "@/components/game/site-footer";
import { CAR_COLORS } from "@/game/constants/customization";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { useCustomizationStore } from "@/stores/customization-store";
import { useSceneStore } from "@/stores/scene-store";

interface GarageProps {
  onStart: () => void;
  onBack: () => void;
}

const REGIONS = ["México", "Europa"] as const;

/** Configurator page — car color, driver, and destination (track). */
export function Garage({ onStart, onBack }: GarageProps) {
  const { carColor, driver, setCarColor, setDriver } = useCustomizationStore();
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const setSky = useSceneStore((s) => s.setSky);

  return (
    <div className="garage">
      <div className="garage__panel">
        <header className="garage__header">
          <button className="garage__back" onClick={onBack} aria-label="Back">
            ← VOLVER
          </button>
          <h2 className="garage__title">GARAGE</h2>
          <span />
        </header>

        <div className="garage__body">
          <section className="garage__section">
            <span className="custom__label">COLOR DEL AUTO</span>
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
          </section>

          <section className="garage__section">
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
          </section>

          <section className="garage__section">
            <span className="custom__label">DESTINO</span>
            {REGIONS.map((region) => (
              <div key={region} className="dest-group">
                <span className="dest-region">{region}</span>
                <div className="dest-grid">
                  {SKY_PRESETS.map((preset, i) =>
                    preset.region === region ? (
                      <button
                        key={preset.id}
                        type="button"
                        className={`dest-card${skyIndex === i ? " dest-card--active" : ""}`}
                        onClick={() => setSky(i)}
                      >
                        {preset.label}
                      </button>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>

        <button className="start__cta garage__drive" onClick={onStart}>
          DRIVE
        </button>
      </div>

      <SiteFooter />
    </div>
  );
}
