# Coastline Drive — Agent & Contributor Guide

> **Coastline Drive** is a high-fidelity 3D coastal highway racing prototype built for portfolio excellence (Phase 1) and commercial AAA scale (Phase 2).

---

## ⭐ PRIME DIRECTIVE (non-negotiable, read first)

> **Coastline Drive must become the best car game that has ever existed.**

This is the single overriding goal of the project. Every decision — visual,
physical, audio, UX, performance — is measured against this bar:

- **No "good enough."** If a result is merely acceptable, it is not done. Push
  geometry, materials, lighting, post-processing, handling feel and audio until
  they read as world-class.
- **Cinematic fidelity.** Clearcoat paint, real IBL reflections, golden-hour
  lighting, bloom on emissives, tasteful post-fx, 60 FPS. The car must look and
  feel like a hero supercar.
- **Handling must feel alive.** Weight, grip, steering response and speed sense
  must be satisfying on keyboard AND gamepad.
- **100% procedural / CC0** (see Asset Policy) — world-class with zero licensed
  assets is part of the challenge, not an excuse to settle.
- **Always verify visuals** on desktop + mobile portrait + mobile landscape, and
  validate the production build before declaring any visual work complete.

When in doubt, ask: "Is this the best car game that has ever existed yet?" If the
honest answer is no, keep going.

---

## Project Vision

### Gameplay
- **Genre**: Sim-cade racing — authentic weight transfer and grip modeling with accessible, fun handling.
- **Setting**: Premium coastal highway with dynamic lighting, HDRI reflections, and cinematic vistas.
- **Vehicle**: Restomod European grand tourer (1960s–1970s silhouette, modern high-tech details).

### Dual-Phase Strategy

| Phase | Goal | Platform | Quality Bar |
|-------|------|----------|-------------|
| **Phase 1** | Portfolio flagship web prototype | Web (Next.js + WebGL) | Production-ready code, 60 FPS target, full controller support |
| **Phase 2** | Commercial AAA multi-platform title | PC + Consoles (UE5 or Unity) | Port core systems; upgrade assets and rendering |

---

## Mandatory Technical Architecture (Phase 1)

### Tech Stack

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Framework | **Next.js 15** (App Router) | Routing, SSR shell, static assets |
| Language | **TypeScript** (strict) | End-to-end type safety |
| 3D Rendering | **React Three Fiber** + **@react-three/drei** | Scene graph, materials, post-processing |
| Physics | **@react-three/rapier** (Rapier.js) | Deterministic rigid-body simulation |
| State | **Zustand** | HUD telemetry bridge only — never simulation state |
| Input | **HTML5 Gamepad API** + keyboard | Xbox controller primary, keyboard fallback |

### Non-Negotiable Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js / React (DOM)                                      │
│  • HUD, menus, telemetry overlays                           │
│  • Zustand read/write for display metrics only              │
│  • NO physics, NO per-frame simulation, NO useState loops   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Zustand (throttled snapshots)
┌──────────────────────────▼──────────────────────────────────┐
│  R3F Canvas (WebGL)                                         │
│  • All 3D rendering, lighting, shadows                      │
│  • Rapier physics world                                     │
│  • Vehicle controller, suspension, wheel transforms         │
│  • Input polling, game logic — useRef + useFrame ONLY       │
└─────────────────────────────────────────────────────────────┘
```

**React reconciliation must never run on the hot path.** Vehicle physics, suspension raycasts, wheel transforms, and all 60+ FPS calculations use `useRef` with direct memory mutation inside `useFrame`. Using `useState` or `useReducer` for simulation logic is **strictly forbidden**.

---

## Asset Policy (Mandatory)

All 3D models, textures, HDRIs, materials, audio, and any other visual or audio content used in Phase 1 must be **100% free** for commercial use and public portfolio display.

### Allowed Sources (only these)

| Source | License | Usage |
|--------|---------|-------|
| **Procedural generation** | Project-owned | **Preferred** — geometry, materials, textures, sky, audio synthesized in code |
| **CC0 / Public Domain** | CC0, PD | External files only when procedural output is insufficient |
| **Code-generated shaders** | Project-owned | PBR, noise, triplanar, road markings, ocean surface |

### Forbidden

- Paid assets (Sketchfab Store, Unity Asset Store, etc.)
- Restricted licenses (CC-BY-NC, CC-BY-SA with share-alike conflicts, editorial-only)
- Copyrighted models/textures without explicit commercial clearance
- AI-generated assets with unclear or non-commercial license terms
- Ripped or extracted content from commercial games

### Compliance Rules

1. **Procedural only (default)** — All assets live in `game/procedural/`. Zero external files. CC0 or Grok Imagine textures require explicit owner approval before use.
2. **Manifest required** — Every file under `public/assets/third-party/` must have a matching entry in `public/assets/ASSET_MANIFEST.json` (name, source URL, license, date added).
3. **No orphan assets** — Undocumented files in `public/assets/` are blocked at review; delete or document before merge.
4. **Audio** — Procedural/Web Audio API synthesis preferred; CC0-only files otherwise (stored under `public/assets/third-party/audio/`).
5. **HDRI / IBL** — Prefer procedural sky (`Sky`, `SkyMesh`, custom shader) + analytic sun. CC0 HDRIs only with explicit owner approval and manifest entry.

### Phase 1 Visual Strategy (procedural-first)

| Element | Approach |
|---------|----------|
| Vehicle body | Extruded/lathe procedural mesh or primitive composition (box + curves); no imported GT mesh |
| Wheels | Cylinder/torus procedural geometry with shader-based tread |
| Coastal road | Spline extrusion + instanced guardrails + vertex-colored asphalt |
| Ocean / cliff | Plane + custom shader (noise displacement, Fresnel) |
| Sky / lighting | Directional sun + `Sky` / procedural gradient; optional CC0 HDRI |
| UI / HUD | CSS + SVG (no licensed icon packs unless CC0) |

---

## Performance Rules

### Hot Path (useFrame)
1. **Refs over state** — All mutable simulation data lives in `useRef<T>`. Mutate in place; never trigger React renders from the game loop.
2. **No allocations in useFrame** — Pre-allocate `Vector3`, `Quaternion`, and scratch buffers outside the loop. Reuse objects every frame.
3. **Throttled HUD updates** — Push telemetry to Zustand at most every 100–200 ms (5–10 Hz), not every frame.
4. **Instancing & LOD** — Environment props use instanced meshes where possible. LOD for distant geometry.
5. **Physics timestep** — Fixed timestep (e.g. 1/60 s) with accumulator pattern; decouple render delta from physics step.
6. **Shadow budget** — Single directional shadow map for sun; limit casters. Use baked AO/lightmaps for static environment where feasible.

### Canvas Configuration
- `dpr={[1, 2]}` — Cap device pixel ratio on high-DPI displays.
- `frameloop="always"` during gameplay; consider `"demand"` only for menus.
- `performance={{ min: 0.5 }}` — Allow R3F adaptive DPR under load.
- `gl={{ antialias: true, powerPreference: "high-performance" }}`.

### TypeScript
- `strict: true` in `tsconfig.json`.
- No `any`. Prefer `interface` for object shapes; `type` for unions and utilities.
- Document performance-critical decisions with brief inline comments.

---

## Folder Structure

```
coastline-drive/
├── app/                      # Next.js App Router (UI shell only)
├── components/
│   ├── game/                 # R3F Canvas, Scene, lighting
│   └── ui/                   # HUD, menus, telemetry overlays
├── game/
│   ├── constants/            # Tunable physics & gameplay values
│   ├── environment/          # Coastal highway scene assembly (consumes procedural)
│   ├── physics/              # Rapier world, colliders, raycast utils
│   ├── procedural/           # ★ PRIMARY asset source — code-generated content
│   │   ├── geometry/         # Road splines, vehicle hull, props, terrain meshes
│   │   ├── materials/        # ShaderMaterial / NodeMaterial definitions
│   │   ├── textures/         # Canvas/DataTexture generators (noise, asphalt, etc.)
│   │   └── audio/            # Web Audio synthesis helpers
│   ├── systems/              # Input, audio playback, telemetry bridge
│   └── vehicles/             # Vehicle controller, suspension, wheels
├── hooks/                    # Non-simulation React hooks
├── lib/                      # Shared utilities, math helpers
├── stores/                   # Zustand stores (HUD bridge)
├── types/                    # Shared TypeScript interfaces
├── config/                   # App & game configuration
└── public/
    └── assets/
        ├── ASSET_MANIFEST.json   # Required license registry for all third-party files
        └── third-party/          # CC0 / Public Domain files ONLY (exception path)
            ├── hdri/             # Verified CC0 environment maps (if used)
            ├── audio/            # Verified CC0 sound effects (if used)
            └── textures/         # Verified CC0 bitmap fallbacks (if used)
```

> **No `public/assets/models/`** — Phase 1 does not import GLTF/GLB vehicle or environment meshes. All geometry is built in `game/procedural/geometry/` or composed from Three.js primitives at runtime.

### Module Boundaries

| Module | May Import From | Must NOT Import |
|--------|-----------------|-----------------|
| `app/`, `components/ui/` | `stores/`, `types/`, `hooks/` | `game/physics/`, `game/vehicles/` |
| `components/game/` | `game/**`, `stores/`, `types/` | `app/` page logic |
| `game/**` | `game/**`, `types/`, `lib/` | React DOM, `components/ui/` |
| `stores/` | `types/` only | `game/**` (stores are written by game, read by UI) |

---

## Coding Conventions

### Naming
- **Files**: `kebab-case.ts` / `kebab-case.tsx`
- **Components**: `PascalCase`
- **Hooks**: `useCamelCase` (simulation hooks live under `game/`, not `hooks/`)
- **Constants**: `SCREAMING_SNAKE_CASE` in `game/constants/`
- **Interfaces**: `PascalCase` with descriptive suffix (`VehicleConfig`, `TelemetrySnapshot`)

### Vehicle Controller Pattern
```typescript
// CORRECT — hot path
const state = useRef<VehicleState>(createInitialState());
useFrame((_, delta) => {
  const s = state.current;
  s.velocity.addScaledVector(s.acceleration, delta);
  chassisRef.current.setTranslation(s.position, true);
});

// FORBIDDEN — triggers reconciliation every frame
const [velocity, setVelocity] = useState(new Vector3());
useFrame(() => setVelocity(v => v.clone().add(accel)));
```

### Telemetry Bridge Pattern
```typescript
// Inside useFrame — write to ref; flush to Zustand on interval
if (clock.elapsedTime - lastTelemetryFlush.current > 0.1) {
  useTelemetryStore.getState().setSnapshot({ speed: s.speedKmh, rpm: s.rpm });
  lastTelemetryFlush.current = clock.elapsedTime;
}
```

---

## Input System Requirements

- **Primary**: Xbox controller via `navigator.getGamepads()` polled in `useFrame`.
- **Fallback**: Keyboard (WASD / arrows for steer/throttle/brake, Space for handbrake).
- **Dead zones**: Apply circular dead zone (0.1–0.15) on analog sticks.
- **Input abstraction**: `InputState` interface consumed by vehicle controller; source-agnostic.

---

## Asset Pipeline (Phase 1)

### Pipeline Priority

```
1. Procedural (game/procedural/)     ← default for every asset class
2. CC0 third-party (public/assets/third-party/)  ← only when procedural is insufficient
3. Everything else                 ← forbidden
```

### Procedural Pipeline (primary)

| Asset | Generator location | Technique |
|-------|-------------------|-----------|
| Road surface | `game/procedural/geometry/road.ts` | Spline extrusion along coastal path; vertex colors for lane markings |
| Guardrails / barriers | `game/procedural/geometry/guardrail.ts` | Instanced box/cylinder meshes along spline |
| Terrain / cliffs | `game/procedural/geometry/terrain.ts` | Heightfield from 2D noise; triplanar shader |
| Ocean | `game/procedural/materials/ocean.ts` | Gerstner or noise-displaced plane + Fresnel |
| Vehicle body | `game/procedural/geometry/vehicle-body.ts` | Composed primitives + lathe/extrude for GT silhouette |
| Wheels | `game/procedural/geometry/wheel.ts` | Cylinder + shader tread; transform-driven spin |
| Asphalt / paint | `game/procedural/textures/asphalt.ts` | `DataTexture` from canvas noise at init (not per-frame) |
| Sky / IBL | `game/environment/sky-setup.tsx` | `Sky` + directional light; CC0 HDRI optional fallback |
| Engine / skid audio | `game/procedural/audio/` | Oscillator + noise buffers via Web Audio API |

### Third-Party Pipeline (exception)

1. Confirm **CC0 or Public Domain** on the source page (screenshot or URL archived in manifest).
2. Place file in the correct `public/assets/third-party/<category>/` subdirectory.
3. Add entry to `ASSET_MANIFEST.json`:

```json
{
  "id": "hdri-coastal-sunset",
  "file": "third-party/hdri/coastal-sunset.hdr",
  "source": "https://polyhaven.com/a/example",
  "license": "CC0",
  "author": "Poly Haven",
  "addedAt": "2026-06-15"
}
```

4. PR review must verify license before merge.

### Build-Time Notes

- Procedural textures are generated once at module init or scene mount — never allocated inside `useFrame`.
- Third-party HDRIs are loaded lazily; prefer procedural sky to avoid large downloads on Vercel.
- No Draco/GLTF pipeline in Phase 1 — reduces dependency on external mesh assets.

---

## Testing & Quality Gates

- TypeScript compiles with zero errors (`strict` mode).
- Dev server runs at stable 60 FPS on mid-range hardware (M1 / RTX 3060 class).
- Controller and keyboard both functional without page focus loss.
- No `useState` inside any file under `game/` or R3F `useFrame` callbacks.
- **Asset compliance**: Every file in `public/assets/third-party/` has a manifest entry; no undocumented or non-CC0 assets.
- **Procedural coverage**: Core scene (road, vehicle, sky, ocean) renders with zero third-party dependencies (verified in CI checklist).

---

## Phase 2 Migration Principles

Systems designed in Phase 1 map cleanly to native engines:

| Web System | UE5 Target | Unity Target |
|------------|------------|--------------|
| Rapier vehicle controller | Chaos Vehicle / custom C++ | WheelCollider + custom torque |
| Zustand telemetry | UMG / Slate HUD | UI Toolkit / uGUI |
| Gamepad polling | Enhanced Input / SDL | Input System package |
| Procedural geometry/shaders | Native UE5/Unity procedural tools | Custom mesh generators port to C++/C# |
| CC0 third-party (if any) | Re-verify license; re-import | Same |
| useFrame game loop | Tick / FixedTick | FixedUpdate |

Keep physics tuning values in `game/constants/` as the single source of truth for porting.

---

## Agent Workflow

1. Read this file before any implementation task.
2. Respect module boundaries — never leak simulation into React state.
3. **Procedural first** — do not import external assets without CC0 verification and manifest entry.
4. Prefer extending existing systems over creating parallel implementations.
5. Use **Plan Mode** for architectural decisions; use sub-agents for parallel exploration.
6. Document performance-critical code with brief comments explaining *why*, not *what*.

---

## Long-Term Goals

- [ ] Phase 1: Playable coastal highway lap with restomod GT
- [ ] Phase 1: Procedural coastal environment + dynamic shadows + post-processing
- [ ] Phase 1: Asset manifest audit — 100% CC0/procedural compliance
- [ ] Phase 1: Full Xbox controller + keyboard input
- [ ] Phase 1: Portfolio-ready README, demo deploy (Vercel)
- [ ] Phase 2: Physics constants port to UE5 Chaos
- [ ] Phase 2: Original authored assets (proprietary) + Nanite-ready coastal pipeline
- [ ] Phase 2: Console certification input & performance targets