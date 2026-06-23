"use client";

import { useState } from "react";
import { DestinationGlobe } from "@/components/game/destination-globe";
import { SiteFooter } from "@/components/game/site-footer";
import { CAR_DESIGNS } from "@/game/constants/cars";
import { CAR_COLORS, WHEEL_COLORS } from "@/game/constants/customization";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { timeOfDay } from "@/game/systems/time-of-day";
import { useCustomizationStore } from "@/stores/customization-store";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";
import { useSceneStore } from "@/stores/scene-store";

const LAP_OPTIONS: { label: string; value: number }[] = [
  { label: "Libre", value: 0 },
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
];

function formatLap(ms: number | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mmm = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(mmm).padStart(3, "0")}`;
}

interface GarageProps {
  onStart: () => void;
  onBack: () => void;
}

const REGIONS = ["México", "Europa"] as const;

/** Configurator page — car color, driver, and destination (track). */
export function Garage({ onStart, onBack }: GarageProps) {
  const { carId, carColor, wheelColor, driver, setCarId, setCarColor, setWheelColor, setDriver } =
    useCustomizationStore();
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const setSky = useSceneStore((s) => s.setSky);
  const night = useSceneStore((s) => s.night);
  const setNight = useSceneStore((s) => s.setNight);
  const bestByTrack = useLapStore((s) => s.bestByTrack);
  const targetLaps = useRaceStore((s) => s.targetLaps);
  const setTargetLaps = useRaceStore((s) => s.setTargetLaps);
  const timeTrial = useRaceStore((s) => s.timeTrial);
  const setTimeTrial = useRaceStore((s) => s.setTimeTrial);
  const [showRecords, setShowRecords] = useState(false);

  return (
    <div className="garage">
      <div className="garage__panel">
        <header className="garage__header">
          <button className="garage__back" onClick={onBack} aria-label="Back">
            ← VOLVER
          </button>
          <h2 className="garage__title">GARAGE</h2>
          <button className="garage__back" onClick={() => setShowRecords(true)}>
            🏆 RÉCORDS
          </button>
        </header>

        <div className="garage__body">
          <section className="garage__section">
            <span className="custom__label">AUTO</span>
            <div className="car-grid">
              {CAR_DESIGNS.map((car) => (
                <button
                  key={car.id}
                  type="button"
                  className={`car-card${carId === car.id ? " car-card--active" : ""}`}
                  onClick={() => setCarId(car.id)}
                >
                  <span className="car-card__name">{car.name}</span>
                  <span className="car-card__tag">{car.tagline}</span>
                </button>
              ))}
            </div>
          </section>

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
            <span className="custom__label">LLANTAS</span>
            <div className="custom__swatches">
              {WHEEL_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`swatch${wheelColor === c.hex ? " swatch--active" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setWheelColor(c.hex)}
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
            <span className="custom__label">MODO</span>
            <div className="custom__toggle">
              <button
                type="button"
                className={`pill${!timeTrial ? " pill--active" : ""}`}
                onClick={() => setTimeTrial(false)}
              >
                Carrera
              </button>
              <button
                type="button"
                className={`pill${timeTrial ? " pill--active" : ""}`}
                onClick={() => setTimeTrial(true)}
              >
                Contrarreloj
              </button>
            </div>
          </section>

          <section className="garage__section">
            <span className="custom__label">VUELTAS</span>
            <div className="custom__toggle">
              {LAP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`pill${targetLaps === opt.value ? " pill--active" : ""}`}
                  onClick={() => setTargetLaps(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section className="garage__section">
            <span className="custom__label">HORA</span>
            <div className="custom__toggle">
              <button
                type="button"
                className={`pill${!night ? " pill--active" : ""}`}
                onClick={() => {
                  timeOfDay.value = 0.42;
                  setNight(false);
                }}
              >
                Día
              </button>
              <button
                type="button"
                className={`pill${night ? " pill--active" : ""}`}
                onClick={() => {
                  timeOfDay.value = 0.86;
                  setNight(true);
                }}
              >
                Noche
              </button>
            </div>
          </section>

          <section className="garage__section garage__section--center">
            <span className="custom__label">DESTINO · gira el globo o elige de la lista</span>
            <div className="dest-layout">
              <DestinationGlobe />
              <div className="dest-list">
                {REGIONS.map((region) => (
                  <div key={region} className="dest-list__group">
                    <span className="dest-region">{region}</span>
                    {SKY_PRESETS.map((preset, i) =>
                      preset.region === region ? (
                        <button
                          key={preset.id}
                          type="button"
                          className={`dest-item${skyIndex === i ? " dest-item--active" : ""}`}
                          onClick={() => setSky(i)}
                        >
                          <span>{preset.label}</span>
                          <span className="dest-item__rec">
                            {formatLap(bestByTrack[preset.id])}
                          </span>
                        </button>
                      ) : null,
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <button className="start__cta garage__drive" onClick={onStart}>
          DRIVE
        </button>
      </div>

      <SiteFooter />

      {showRecords && (
        <div
          className="legal"
          role="dialog"
          aria-modal="true"
          aria-label="Récords"
          onClick={() => setShowRecords(false)}
        >
          <div className="legal__panel" onClick={(e) => e.stopPropagation()}>
            <header className="legal__head">
              <h2 className="legal__title">🏆 RÉCORDS · Mejor vuelta</h2>
              <button className="legal__close" onClick={() => setShowRecords(false)} aria-label="Cerrar">
                ✕
              </button>
            </header>
            <div className="legal__body">
              <div className="records">
                {SKY_PRESETS.map((p) => (
                  <div key={p.id} className="records__row">
                    <span>{p.label}</span>
                    <span className={`records__time${bestByTrack[p.id] != null ? " records__time--set" : ""}`}>
                      {formatLap(bestByTrack[p.id])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
