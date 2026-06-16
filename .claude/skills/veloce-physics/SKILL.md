---
name: veloce-physics
description: Architecture invariants and debugging playbook for the Veloce Coastal vehicle simulation. Use when touching vehicle handling, the road spline/circuit, ground contact, camera follow, telemetry, or when debugging "car falls through the world", "car goes off the road/into the sea", NaN HUD errors, or handling feel. Documents the kinematicPosition + analytic-integrator design that replaced the unstable dynamic-body approach.
---

# Veloce Coastal — Vehicle Physics Skill

## Current architecture (Phase 1, stable)
The car is a **`kinematicPosition`** Rapier body driven by an **analytic arcade
integrator** — NOT a dynamic body with forces. This is deliberate and load-bearing:

- The integrator runs in `useBeforePhysicsStep` and owns `speedMs` (signed),
  `heading` (yaw), and XZ position. See `game/vehicles/vehicle-controller.tsx`.
- Chassis **Y is pinned every step** to `getRoadSurfaceY + getChassisRestHeightAboveRoad()`.
  → The car can never fall: there is no gravity integration on it.
- XZ is advanced along `heading`, then **clamped laterally** to the road via
  `getRoadSurfaceAt` (nearest-point projection) and `VEHICLE_CONFIG.maxLateralOffset`.
  → The car can never leave the asphalt / reach the sea.
- The road is a **closed circuit** (`CatmullRomCurve3(points, true)` in
  `game/procedural/geometry/road-path.ts`) → laps never end.
- Pose is written via `setNextKinematicTranslation` / `setNextKinematicRotation`
  so Rapier interpolates the render transform smoothly.

## Invariants — do not break
- **No `useState` on the hot path.** All sim state lives in `useRef`. Pre-allocate
  Vector3/Quaternion scratch at module scope.
- **Zustand is HUD-only**, flushed at ~10 Hz (`TELEMETRY_FLUSH_INTERVAL`). Every
  numeric field passes through `finiteOr` before the store, which also sanitizes.
- **Guard every value with `finiteOr` / `Number.isFinite`** in the integrator.
- UI must not import `game/physics` or `game/vehicles`.
- Do **not** reintroduce a dynamic body + force drive + `applyGroundConstraint`
  snapping (the old approach): it fought Rapier's solver and produced NaN blow-ups
  and fall-through. (`ground-constraint.ts` / `chassis-state.ts` are legacy/dead.)

## Tuning (`game/constants/vehicle.ts`)
- Longitudinal: `engineForce`, `brakeForce`, `drag`, `rollingResistance`,
  `maxSpeedMs`, `reverseMaxSpeedMs` (accel = force/mass in the integrator).
- Steering: `maxSteerAngle`, `steerSpeed` (smoothing), `turnRate` (peak yaw),
  `turnReadinessSpeed` (speed needed for full steering authority).
- Containment: `maxLateralOffset` (must stay < ROAD_WIDTH/2 minus car half-width).
- Forward = local **+Z**; world dir = `(sin heading, cos heading)`; steer sign is
  negated so D/right turns toward screen-right.
- **Handling "soul" (`VEHICLE_CONFIG.handling`):** the car *points* at `heading`
  but *travels* along `velAngle`, which lags heading by a grip factor (drops with
  handbrake and cornering load) → visible drift/slip. Movement advances along
  `velAngle`, not heading. Visual weight transfer (`bodyPitch`/`bodyRoll`) is
  applied to the body mesh in `useFrame` only — wheels stay flat (suspension feel).
  All render-only; tune freely without touching the containment guarantees.

## Debugging playbook
- **NaN in HUD:** almost always a stale `.next` bundle — `rm -rf .next` and hard
  refresh first. Otherwise trace `sim.speedMs`/`heading`; confirm `finiteOr` guards.
- **Car falls / floats:** check `getRoadSurfaceY` returns finite; confirm Y pin in
  `stepVehicle`; confirm `restHeight` matches wheel mount + restLength + radius.
- **Car off road / into sea:** check the lateral clamp and that the circuit is
  closed; verify `getRoadInteriorSign` orients cliffs interior / ocean exterior.
- **Handling feels off:** tune the constants above; never add per-frame allocs.

## Verify
`npm run typecheck` → `npm run build` → `npm run start` + curl 200. Then drive in
`npm run dev` (port 3002, hard refresh) on keyboard and gamepad.
