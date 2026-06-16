import { DataTexture, LinearFilter, RepeatWrapping, RGBAFormat } from "three";

/** Generates asphalt noise at init — never called inside useFrame. */
export function createAsphaltTexture(size = 256): DataTexture {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const noise =
        Math.sin(x * 0.42) * Math.cos(y * 0.38) +
        Math.sin((x + y) * 0.17) * 0.5;
      const base = 42 + noise * 8;
      data[i] = base;
      data[i + 1] = base;
      data[i + 2] = base + 2;
      data[i + 3] = 255;
    }
  }

  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  return texture;
}