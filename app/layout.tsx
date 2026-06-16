import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veloce Coastal",
  description:
    "High-fidelity coastal highway racing prototype — procedural assets, sim-cade physics.",
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