"use client";

import { SiteFooter } from "@/components/game/site-footer";

interface LandingProps {
  onEnter: () => void;
}

/** Landing / title page — leads into the Garage configurator. */
export function Landing({ onEnter }: LandingProps) {
  return (
    <div className="landing">
      <div className="start__inner">
        <span className="start__tag">PROTOTYPE · WORK IN PROGRESS</span>
        <h1 className="start__title">COASTLINE</h1>
        <h2 className="start__subtitle">DRIVE</h2>
        <p className="start__tagline">
          A procedural coastal-highway racer — built in code, no modeled assets.
        </p>
        <button className="start__cta" onClick={onEnter} autoFocus>
          ENTER
        </button>
      </div>

      <div className="landing__keys">
        W/S acelerar · A/D girar · Espacio derrape · ESC pausa · N playa · T día/noche · L faros · H foto
      </div>

      <div className="signature" aria-hidden="true">
        Created by Armando Blanco
      </div>

      <SiteFooter />
    </div>
  );
}
