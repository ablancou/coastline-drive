"use client";

import { DestinationGlobe } from "@/components/game/destination-globe";
import { SiteFooter } from "@/components/game/site-footer";
import { CAR_COLORS } from "@/game/constants/customization";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { useCustomizationStore } from "@/stores/customization-store";
import { useSceneStore } from "@/stores/scene-store";

interface GarageProps {
  onStart: () => void;
  onBack: () => void;
}

/** Configurator page — car color, driver, and destination (track). */
export function Garage({ onStart, onBack }: GarageProps) {
  const { carColor, driver, setCarColor, setDriver } = useCustomizationStore();
  const skyIndex = useSceneStore((s) => s.skyIndex);

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

          <section className="garage__section garage__section--center">
            <span className="custom__label">DESTINO · gira el globo y toca un pin</span>
            <DestinationGlobe />
            <span className="dest-selected">
              {SKY_PRESETS[skyIndex % SKY_PRESETS.length]?.label}
            </span>
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
