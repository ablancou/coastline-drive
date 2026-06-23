import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0a1018",
  width: "device-width",
  initialScale: 1,
};

const DESCRIPTION =
  "A procedural coastal-highway racing game — code-built world, sim-cade drift handling, day/night, and CC0 skies. By Armando Blanco.";

export const metadata: Metadata = {
  metadataBase: new URL("https://coastline-drive.vercel.app"),
  title: "Coastline Drive — procedural racing game",
  description: DESCRIPTION,
  authors: [{ name: "Armando Blanco", url: "https://www.armandoblanco.dev/" }],
  openGraph: {
    title: "Coastline Drive",
    description: DESCRIPTION,
    url: "/",
    siteName: "Coastline Drive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coastline Drive",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}