import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch / home-screen icon. */
export default function AppleIcon() {
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
          background: "linear-gradient(135deg, #1b3f8f 0%, #0a1018 100%)",
          color: "#bcd9ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -4, display: "flex" }}>CD</div>
        <div style={{ fontSize: 16, letterSpacing: 6, color: "#6a8aa8", display: "flex" }}>
          COASTLINE
        </div>
      </div>
    ),
    size,
  );
}
