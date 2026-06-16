import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coastline Drive",
  description:
    "A procedural coastal-highway racing game — code-built world, sim-cade drift handling, CC0 skies.",
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