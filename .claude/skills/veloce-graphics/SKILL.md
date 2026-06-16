---
name: veloce-graphics
description: Quality bar and workflow for any visual/graphics work in Veloce Coastal (the car, environment, lighting, materials, post-fx). Use whenever changing anything visible in the 3D scene or HUD, or when asked to "make it look better", "improve graphics", "AAA look", "best car game". Enforces procedural-only assets, PBR/IBL standards, post-processing, and the desktop+mobile responsive + production-build verification gates.
---

# Veloce Coastal — Graphics Quality Skill

**Prime directive:** Veloce Coastal must become *the best car game that has ever
existed*. Visual work is never "good enough" until it reads as world-class.

## When to use
Any change to: vehicle geometry/materials, environment (road, terrain, ocean,
cliffs, guardrails, sky), lighting, the procedural environment map, post-fx, the
camera look, or the HUD.

## Hard constraints (do not violate)
- **100% procedural or CC0.** No GLTF/GLB, no external textures/HDRIs. Reflections
  come from `<Environment>` + `<Lightformer>` (built at runtime), never a fetched
  HDRI. New CC0 files require owner approval + a manifest entry.
- **Module boundaries.** `components/ui/` must not import `game/physics` or
  `game/vehicles`. Procedural generators live in `game/procedural/`.
- **No allocations / no `useState` in `useFrame`.** Pre-allocate scratch objects.
- Procedural geometry/textures are built once at init (`useMemo`/module scope),
  never per frame.

## Quality checklist (aim for all)
- **Materials:** car paint = `MeshPhysicalMaterial` with `clearcoat`; chrome =
  metalness 1 / low roughness; glass = low roughness + transmission; lights use
  `emissive` + `emissiveIntensity` so Bloom catches them. Set `envMapIntensity`.
- **Lighting:** one warm key directional (casts the shadow map) + cool fill +
  hemisphere bounce. Golden-hour palette. Shadow camera must cover the whole
  circuit (loop is ~±64 units).
- **IBL:** procedural `<Environment resolution={256} frames={1}>` with Lightformers
  for sky/ground/sun reflections.
- **Tone mapping:** `ACESFilmicToneMapping` on the renderer.
- **Post-fx** (`components/game/post-fx.tsx`): Bloom (mipmapBlur, threshold tuned
  so only emissives glow), Vignette, SMAA. Keep it tasteful, protect 60 FPS.
- **Performance:** instanced meshes for repeated props; `dpr={[1,2]}`; cap shadow
  map size; target 60 FPS on M1 / RTX 3060.

## Mandatory verification (every visual change)
1. `npm run typecheck` — zero errors.
2. `npm run build` — must succeed (catches `'use client'`/SSR issues).
3. `npm run start` + `curl -sI http://localhost:3002/` → HTTP 200.
4. Visually verify on **three viewports**: desktop ≥1024px, mobile portrait
   375×812, mobile landscape 667×375. If you cannot view all three, say which are
   unverified.

## Key files
- `game/procedural/geometry/vehicle-body.ts`, `.../wheel.ts`
- `game/environment/sky-setup.tsx`, `.../coastal-scene.tsx`
- `game/procedural/materials/ocean.ts`, `.../textures/asphalt.ts`
- `components/game/post-fx.tsx`, `components/game/game-canvas.tsx`
