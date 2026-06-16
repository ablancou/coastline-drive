# Veloce Coastal

A high-fidelity 3D coastal highway racing prototype — sim-cade handling, premium restomod grand tourer, and cinematic WebGL lighting.

**Phase 1** delivers a production-ready web prototype for portfolio showcase. **Phase 2** extends the architecture toward a commercial AAA multi-platform release.

> **Status (2026-06-16):** The project compiles and runs, but has **critical runtime bugs** — the vehicle falls through the world and React throws a `NaN` telemetry error in the HUD. See [Known Issues & Debugging](#known-issues--debugging) below.

---

## Tech Stack

| Technology | Version | Role |
|------------|---------|------|
| [Next.js](https://nextjs.org/) | 15.5.x | App Router, project shell, deployment |
| [React](https://react.dev/) | 19.x | UI shell + R3F host |
| [TypeScript](https://www.typescriptlang.org/) | 5.8.x | Strict-mode type safety |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | 9.x | Declarative Three.js scene graph |
| [@react-three/drei](https://github.com/pmndrs/drei) | 10.x | Sky, helpers |
| [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) | 2.x | Deterministic WASM physics |
| [Three.js](https://threejs.org/) | 0.175.x | Rendering |
| [Zustand](https://github.com/pmndrs/zustand) | 5.x | HUD telemetry bridge only |
| HTML5 Gamepad API | — | Xbox controller (keyboard fallback) |

**Dev server port:** `3002` (`npm run dev` → http://localhost:3002)

---

## Architecture Summary

```
┌──────────────────┐     throttled      ┌──────────────────┐
│  React UI / HUD  │ ◄── snapshots ──── │  Zustand Store   │
└──────────────────┘     (10 Hz)        └────────▲─────────┘
                                               │
┌──────────────────────────────────────────────┴─────────┐
│  R3F Canvas (WebGL)                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Input System│→ │Vehicle Ctrl  │→ │ Rapier World│  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
│         useRef + useFrame / useBeforePhysicsStep       │
│         useAfterPhysicsStep (60 FPS, no React state) │
└──────────────────────────────────────────────────────┘
```

**Non-negotiable rule:** All physics, rendering updates, and per-frame logic run inside the R3F Canvas using `useRef` + `useFrame`. React handles only UI overlays and reads throttled telemetry from Zustand. **Never** use `useState` for simulation inside `game/` or `useFrame` callbacks.

Full contributor rules: [AGENTS.md](./AGENTS.md)

---

## Asset Policy

All visuals and audio in Phase 1 are **100% portfolio-safe**:

- **Procedural generation** (code-built geometry, shaders, textures) — **default and only path used so far**
- **CC0 / Public Domain** third-party files — exception only, tracked in `ASSET_MANIFEST.json`
- **No** paid, restricted-license, or copyrighted assets

Current manifest: `public/assets/ASSET_MANIFEST.json` — **3 CC0 HDRIs** (Poly Haven coastal skies used for the environment map / IBL). All other assets remain procedural.

---

## What Is Implemented (Phase 1)

### App shell
| File | Purpose |
|------|---------|
| `app/page.tsx` | Renders `GameShell` |
| `app/layout.tsx` | Root layout + global CSS |
| `app/globals.css` | Full-viewport canvas + HUD overlay styles |
| `components/game/game-shell.tsx` | Dynamic-imports Canvas (no SSR), mounts HUD |
| `components/game/game-canvas.tsx` | R3F Canvas config (`dpr`, shadows, performance), initial chase camera pose from spawn |
| `components/game/game-scene.tsx` | Assembles sky, camera, coastal scene, physics world, vehicle |
| `components/ui/hud.tsx` | Speed, RPM, gear, input source, throttle/brake/steer bars |

### Environment (100% procedural)
| File | Purpose |
|------|---------|
| `game/environment/coastal-scene.tsx` | Road mesh, terrain, ocean plane, guardrails, cliff rocks |
| `game/environment/sky-setup.tsx` | Directional sun + drei `Sky` |
| `game/environment/guardrails.tsx` | Instanced guardrails along road spline |
| `game/environment/cliff-rocks.tsx` | Instanced procedural cliff rocks (inland side) |
| `game/procedural/geometry/road.ts` | Spline-extruded road mesh with vertex-colored lane markings |
| `game/procedural/geometry/road-path.ts` | Catmull-Rom coastal spline, `getRoadSurfaceAt`, `getRoadSurfaceY` |
| `game/procedural/geometry/terrain.ts` | Heightfield terrain with vertex colors |
| `game/procedural/geometry/guardrail.ts` | Guardrail instance transforms along spline |
| `game/procedural/geometry/cliff-rocks.ts` | Rock instance transforms |
| `game/procedural/textures/asphalt.ts` | Canvas-generated asphalt `DataTexture` |
| `game/procedural/materials/ocean.ts` | Custom shader (noise + Fresnel) |

### Vehicle (procedural mesh)
| File | Purpose |
|------|---------|
| `game/procedural/geometry/vehicle-body.ts` | Composed primitives — restomod GT silhouette |
| `game/procedural/geometry/wheel.ts` | Cylinder wheel mesh |
| `game/vehicles/vehicle-controller.tsx` | Rapier rigid body, drive/brake/steer forces, wheel visuals, telemetry flush |
| `game/constants/vehicle.ts` | Mass, forces, suspension tuning, wheel mounts |
| `game/constants/spawn.ts` | Spawn pose on road spline (`SPAWN_T = 0.04`) |

### Physics
| File | Purpose |
|------|---------|
| `game/physics/physics-world.tsx` | Rapier `Physics` wrapper, gravity `[0, -9.81, 0]`, 60 Hz timestep |
| `game/physics/road-collider.tsx` | ~20 thick box colliders along road spline |
| `game/physics/environment-colliders.tsx` | Terrain trimesh collider (fixed) |
| `game/physics/suspension-raycast.ts` | **Analytic** suspension sampling from road spline (no Rapier rays) — grounded flags + visual spring lengths only |
| `game/physics/ground-constraint.ts` | Hard Y snap to road spline height before/after physics step |
| `game/physics/chassis-state.ts` | `isChassisStateFinite`, `resetChassisToSpawn` |
| `game/constants/physics.ts` | `PHYSICS_TIMESTEP = 1/60` |

### Camera
| File | Purpose |
|------|---------|
| `game/systems/chase-camera.tsx` | Smooth third-person follow, snap on first frame |
| `game/systems/chase-camera-math.ts` | Behind-car offset (`-distance` on forward axis), speed pullback |
| `game/systems/camera-bootstrap.tsx` | Initial camera setup hook |
| `game/constants/camera.ts` | Chase camera tuning |
| `game/systems/vehicle-target.ts` | Mutable pose ref written from `useFrame`, read by camera |

### Input & telemetry
| File | Purpose |
|------|---------|
| `game/systems/input-system.ts` | Gamepad (primary) + WASD/arrow keyboard fallback |
| `game/constants/input.ts` | Deadzone, telemetry flush interval (0.1 s) |
| `stores/telemetry-store.ts` | Zustand store with `sanitizeTelemetry` on every write |
| `types/telemetry.ts` | `TelemetrySnapshot` interface |
| `types/input.ts` | `InputState` interface |
| `types/vehicle.ts` | `VehicleSimState`, `WheelMount` |
| `lib/math.ts` | `clamp`, `applyDeadzone`, `finiteOr` |

---

## Physics Design (Current)

### Vehicle rigid body
- Dynamic cuboid collider (`chassisHalfExtents: [0.92, 0.38, 2.05]`)
- Mass: 1280 kg
- `enabledRotations={[false, true, false]}` — yaw only
- `gravityScale={0}` — gravity disabled on vehicle (attempt to stop falling)
- `canSleep={false}`, `ccd` enabled
- Spawn position set directly on `<RigidBody position={...}>` (not parent group)

### Ground contact strategy (layered)
1. **Road box colliders** — fixed segments along spline (`road-collider.tsx`)
2. **Terrain trimesh** — fixed collider under cliffs (`environment-colliders.tsx`)
3. **Fallback ground box** — large fixed cuboid at `y ≈ -0.35`
4. **Analytic suspension** — samples `getRoadSurfaceY(hubX, hubZ)` for grounded flags (no Rapier raycasts)
5. **`applyGroundConstraint`** — runs in both `useBeforePhysicsStep` and `useAfterPhysicsStep`:
   - Snaps chassis Y to `roadSurfaceY + getChassisRestHeightAboveRoad()`
   - Zeros vertical velocity
6. **`resetChassisToSpawn`** — if position/velocity/rotation become non-finite

### Drive model (sim-cade)
- `addForce` for throttle/drag/rolling resistance/brake (world-forward aligned)
- `addTorque` on Y for speed-dependent steering
- Grounded factor scales drive force by fraction of wheels marked grounded

### Chassis rest height above road
```
hubOffset (|wheel.position[1]|) + restLength + wheelRadius
= 0.12 + 0.34 + 0.36 = 0.82 m
```
Road surface Y ≈ 0.02 → spawn chassis Y ≈ 0.84

---

## Known Issues & Debugging

### 🔴 Issue 1: React NaN error in HUD (BLOCKING)

**Symptom:**
```
Received NaN for the `children` attribute.
components/ui/hud.tsx (line ~17–19) — speed display
```

**Expected root cause:** Rapier `linvel()` or `sim.speedMs` becomes `NaN` when physics state blows up (often after bad forces or invalid `setTranslation`).

**Mitigations already applied (user reports error unchanged):**
- `finiteOr()` helper in `lib/math.ts`
- HUD uses `formatInt()` → always renders a string, never raw `Math.round(NaN)`
- `telemetry-store.ts` sanitizes every field on `setSnapshot`
- `vehicle-controller.tsx` sanitizes before writing to store
- Chassis NaN detection + `resetChassisToSpawn`

**Suspicion:** Browser may be serving **stale bundle** (old dev server ran 70+ minutes without restart). Error stack may still reference old line numbers (`Math.round(snapshot.speedKmh)` without `finiteOr`). User should hard-refresh after killing port 3002 and clearing `.next`.

**Still needs investigation:**
- Exact frame when `linvel()` first returns NaN
- Whether NaN originates before first telemetry flush
- Whether React 19 strict mode / hydration causes a separate NaN path
- Add `console.assert(Number.isFinite(...))` guards with stack traces in dev

---

### 🔴 Issue 2: Vehicle falls through the world (BLOCKING)

**Symptom:** Car drops vertically through terrain/road; camera may appear to look at empty space or ground.

**History of attempted fixes:**
1. Rapier raycast suspension → unreliable with trimesh timing → **replaced with analytic spline sampling**
2. Spawn height too high / rays too short → adjusted spawn via `getChassisRestHeightAboveRoad()`
3. RigidBody on parent `<group>` → **fixed**: position on `<RigidBody>` directly
4. Analytic spring-damper with `addForceAtPoint` → forces may have exploded simulation → **removed vertical forces**; suspension is visual/grounded-only now
5. `applyGroundConstraint` after physics only → **extended to before AND after** physics step
6. `gravityScale={0}` on vehicle → gravity should not pull car down
7. Stronger Y snap (always pin to spline height, zero `vel.y`)

**Despite all above, user reports car still falls.**

**Hypotheses to test:**
- `applyGroundConstraint` not running (chassis ref null, physics hooks order)
- `getRoadSurfaceAt` returns wrong Y when car has drifted far in XZ
- Rapier `setTranslation` in after-step fights collider penetration resolution
- Vehicle collider falls through gaps between road box segments
- Terrain trimesh + road boxes conflict; car tunnels through thin boxes
- `@react-three/rapier` version interaction with Rapier WASM (check `interpolate` + manual `setTranslation`)
- Consider **kinematic** body for Phase 1, or drive XZ directly without Rapier gravity

---

### 🟡 Issue 3: Camera (partially fixed)

**Was:** Camera offset `[0, 3.6, +8.8]` placed camera **in front** of car.

**Fix:** `computeChaseCameraPose()` uses `-distance` on forward axis (behind car). Snap on first active frame.

**May still look wrong** if vehicle position is invalid or car has fallen below view.

---

### 🟡 Issue 4: Black screen (fixed)

Canvas not filling viewport. Fixed with `style={{ width/height: 100% }}` on Canvas + `.app__canvas canvas { width/height: 100% !important }`.

---

## Project Structure (actual files)

```
veloce-coastal/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── game/
│   │   ├── game-canvas.tsx
│   │   ├── game-scene.tsx
│   │   └── game-shell.tsx
│   └── ui/
│       └── hud.tsx
├── game/
│   ├── constants/
│   │   ├── camera.ts
│   │   ├── input.ts
│   │   ├── physics.ts
│   │   ├── spawn.ts
│   │   └── vehicle.ts
│   ├── environment/
│   │   ├── cliff-rocks.tsx
│   │   ├── coastal-scene.tsx
│   │   ├── guardrails.tsx
│   │   └── sky-setup.tsx
│   ├── physics/
│   │   ├── chassis-state.ts
│   │   ├── environment-colliders.tsx
│   │   ├── ground-constraint.ts
│   │   ├── physics-world.tsx
│   │   ├── road-collider.tsx
│   │   └── suspension-raycast.ts
│   ├── procedural/
│   │   ├── geometry/
│   │   │   ├── cliff-rocks.ts
│   │   │   ├── guardrail.ts
│   │   │   ├── road-path.ts
│   │   │   ├── road.ts
│   │   │   ├── terrain.ts
│   │   │   ├── vehicle-body.ts
│   │   │   └── wheel.ts
│   │   ├── materials/
│   │   │   └── ocean.ts
│   │   └── textures/
│   │       └── asphalt.ts
│   ├── systems/
│   │   ├── camera-bootstrap.tsx
│   │   ├── chase-camera-math.ts
│   │   ├── chase-camera.tsx
│   │   ├── input-system.ts
│   │   └── vehicle-target.ts
│   └── vehicles/
│       └── vehicle-controller.tsx
├── hooks/                  # (empty — reserved)
├── lib/
│   └── math.ts
├── stores/
│   └── telemetry-store.ts
├── types/
│   ├── input.ts
│   ├── telemetry.ts
│   └── vehicle.ts
├── config/                 # (empty — reserved)
├── public/assets/
│   └── ASSET_MANIFEST.json
├── AGENTS.md               # Agent/contributor architecture guide
├── package.json
└── tsconfig.json
```

---

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later
- Modern browser with WebGL 2 support
- Xbox controller (optional; keyboard fallback included)

---

## Setup & Run

```bash
git clone <repo-url>
cd Game_Cars
npm install

# Kill any stale dev server on 3002, clear cache, restart
lsof -ti :3002 | xargs kill -9 2>/dev/null
rm -rf .next
npm run dev
```

Open http://localhost:3002 — hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`).

### Controls

| Input | Action |
|-------|--------|
| RT / W / ↑ | Throttle |
| LT / S / ↓ | Brake |
| Left Stick / A D | Steer |
| A button / Space | Handbrake |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server on **port 3002** |
| `npm run build` | Production build (passes as of 2026-06-16) |
| `npm run start` | Serve production build on port 3002 |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript strict check (passes) |

---

## Performance Targets

- **60 FPS** on mid-range hardware (Apple M1, NVIDIA RTX 3060 class)
- Physics fixed timestep at 60 Hz
- HUD telemetry updates at 10 Hz (`TELEMETRY_FLUSH_INTERVAL = 0.1`)
- Device pixel ratio capped at 2×

---

## Roadmap

### Phase 1 — Web Prototype
- [x] Project foundation & architecture docs (`AGENTS.md`, `README.md`)
- [x] Next.js + R3F Canvas scaffold
- [x] Vehicle physics controller (Rapier) — **unstable / falling**
- [x] Input system (Gamepad + keyboard)
- [x] HUD & telemetry overlay — **NaN runtime error**
- [x] Procedural coastal environment + sky/lighting
- [x] Instanced guardrails + cliff rocks
- [x] Third-person chase camera
- [x] Zero external assets (100% procedural)
- [ ] **Fix vehicle ground contact / NaN telemetry** ← current blocker
- [ ] Playable lap with stable driving feel
- [ ] Portfolio demo deploy (Vercel)

### Phase 2 — Commercial AAA
- [ ] Port physics constants to UE5 Chaos / Unity WheelCollider
- [ ] Original proprietary asset pipeline
- [ ] Console input & certification
- [ ] Multiplayer networking architecture

---

## License

Proprietary — All rights reserved.