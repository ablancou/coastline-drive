# Coastline Drive

A high-fidelity 3D coastal-highway racing game for the web — sim-cade drift
handling, a restomod grand-tourer, cinematic image-based lighting, and a
**100% code-built world** (zero modeled assets).

**▶ Live demo:** https://coastline-drive.vercel.app  ·  built with Next.js + React Three Fiber + Rapier

> **Phase 1** is a production-ready portfolio prototype. **Phase 2** extends the
> architecture toward a commercial multi-platform release.

---

## Highlights

- **Drivable closed coastal circuit** — a Catmull-Rom loop you can lap endlessly,
  generated entirely in code (road, terrain, cliffs, guardrails, ocean).
- **Sim-cade handling with soul** — analytic kinematic vehicle with throttle/brake/
  reverse, speed-sensitive steering, **drift/grip** (the car points one way and
  slides another), and **visual weight transfer** (squat, dive, body roll).
- **Switchable coastal skies** — press **N** to cycle real CC0 HDRI environments
  evoking Acapulco, Cancún, Los Cabos, Niza, Positano and Portofino. Each provides
  both the sky and physically-based reflections on the car.
- **Procedural engine audio** — Web Audio synthesis (oscillator engine tied to RPM,
  tire/road and wind noise) with no sample files. Press **M** to mute.
- **Cinematic rendering** — ACES tone mapping, IBL reflections, bloom on emissive
  lights, vignette, SMAA, dynamic shadows.
- **Full controller + keyboard support** and a real-time telemetry HUD.
- **Zero modeled/imported assets** — every mesh, texture and material is built at
  runtime; the only external files are CC0 HDRI skies (tracked in the manifest).

---

## Tech Stack

| Technology | Role |
|------------|------|
| [Next.js 15](https://nextjs.org/) (App Router) | Project shell, deployment |
| [React 19](https://react.dev/) | UI shell + R3F host |
| [TypeScript (strict)](https://www.typescriptlang.org/) | End-to-end type safety |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [drei](https://github.com/pmndrs/drei) | Declarative Three.js scene graph |
| [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) | WASM physics world |
| [@react-three/postprocessing](https://github.com/pmndrs/postprocessing) | Bloom / vignette / SMAA |
| [Three.js](https://threejs.org/) | Rendering |
| [Zustand](https://github.com/pmndrs/zustand) | HUD telemetry bridge only |
| Web Audio API | Procedural engine/tire/wind audio |
| HTML5 Gamepad API | Xbox controller (keyboard fallback) |

---

## Controls

| Input | Action |
|-------|--------|
| **W** / RT | Throttle |
| **S** / LT | Brake · reverse |
| **A** **D** / Left stick | Steer |
| **Space** / A button | Handbrake · drift |
| **N** | Cycle coastal sky (beach preset) |
| **M** | Mute / unmute audio |

---

## Architecture

```
┌──────────────────┐   throttled (10 Hz)   ┌──────────────────┐
│  React UI / HUD  │ ◄──── snapshots ───── │  Zustand Store   │
└──────────────────┘                       └────────▲─────────┘
                                                  │
┌─────────────────────────────────────────────────┴───────────┐
│  R3F Canvas (WebGL)                                          │
│  Input → Vehicle Controller → Rapier World → Camera / Audio  │
│  useRef + useFrame / useBeforePhysicsStep (60 FPS, no state) │
└──────────────────────────────────────────────────────────────┘
```

**Non-negotiable rule:** all simulation runs inside the R3F Canvas with
`useRef` + `useFrame`/physics hooks — never React `useState` on the hot path.
React handles only UI overlays, reading throttled telemetry from Zustand.

The vehicle is a **`kinematicPosition`** body driven by an analytic integrator:
its Y is pinned to the road spline every step (it can never fall through the
world or run into the sea), and its motion is fully deterministic and
finite-guarded (no physics-solver NaN blow-ups). See [AGENTS.md](./AGENTS.md)
for the full contributor guide.

---

## Run locally

```bash
npm install
npm run dev        # http://localhost:3002
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3002 |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run typecheck` | TypeScript strict check |

---

## Asset Policy

Portfolio-safe by design:

- **Procedural first** — geometry, textures, materials, audio and the road
  network are generated in code (`game/procedural/`). Zero modeled/imported meshes.
- **CC0 only** for the few external files — the coastal HDRI skies are sourced
  from [Poly Haven](https://polyhaven.com) (CC0) and documented in
  `public/assets/ASSET_MANIFEST.json`.
- No paid, restricted-license, or copyrighted assets.

---

## Roadmap

- [x] Playable closed coastal circuit + stable, fun handling
- [x] Drift/grip model + visual weight transfer
- [x] Procedural engine/tire/wind audio
- [x] Switchable CC0 HDRI coastal skies + cinematic post-fx
- [x] Portfolio deploy on Vercel
- [ ] Lap timer, best lap & ghost
- [ ] Day/night cycle + wet-road reflections
- [ ] Dynamic FOV / speed-sense effects (particles, motion blur)
- [ ] Phase 2: port physics constants to UE5 Chaos / Unity

---

## License

Proprietary — All rights reserved. CC0 third-party skies retain their original
CC0 license (see manifest).
