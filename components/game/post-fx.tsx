"use client";

import {
  Bloom,
  EffectComposer,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";

/**
 * Cinematic post-processing stack: bloom on emissive lights, edge AA, and a
 * subtle vignette. Runs inside the R3F Canvas only.
 */
export function PostFx() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.85}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.25}
      />
      <Vignette offset={0.22} darkness={0.72} eskil={false} />
      <SMAA />
    </EffectComposer>
  );
}
