import { CanvasTexture, RepeatWrapping } from "three";

/** Black/white checkerboard texture (racing flag) — procedural, no asset file. */
export function createCheckerTexture(cells = 8): CanvasTexture {
  const px = 128;
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d")!;
  const s = px / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#f4f4f4" : "#101014";
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}
