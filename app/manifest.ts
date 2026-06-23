import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coastline Drive",
    short_name: "Coastline",
    description: "A procedural coastal-highway racing game by Armando Blanco.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#05080d",
    theme_color: "#0a1018",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
