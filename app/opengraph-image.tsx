import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Coastline Drive — procedural coastal racing game";

/** Social share card, generated at build time (no external image asset). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 120% at 50% 20%, #1a3350 0%, #0a1018 60%, #05080d 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 40,
            letterSpacing: 12,
            color: "#e85d4a",
            display: "flex",
          }}
        >
          PROTOTYPE
        </div>
        <div
          style={{
            fontSize: 130,
            fontWeight: 800,
            letterSpacing: 8,
            color: "#bcd9ef",
            display: "flex",
          }}
        >
          COASTLINE
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 300,
            letterSpacing: 36,
            color: "#6a8aa8",
            display: "flex",
          }}
        >
          DRIVE
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 30,
            color: "rgba(200,212,224,0.75)",
            display: "flex",
          }}
        >
          Procedural coastal-highway racer · by Armando Blanco
        </div>
      </div>
    ),
    size,
  );
}
