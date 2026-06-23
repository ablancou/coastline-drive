"use client";

import { useLegalStore } from "@/stores/legal-store";

/** Attribution footer with a link to the author's portfolio + legal links. */
export function SiteFooter() {
  const open = useLegalStore((s) => s.open);

  return (
    <footer className="site-footer">
      <span>
        © 2026{" "}
        <a href="https://www.armandoblanco.dev/" target="_blank" rel="noopener noreferrer">
          Armando Blanco
        </a>
      </span>
      <span className="site-footer__sep">·</span>
      <button className="site-footer__link" onClick={() => open("terms")}>
        Términos
      </button>
      <span className="site-footer__sep">·</span>
      <button className="site-footer__link" onClick={() => open("privacy")}>
        Privacidad
      </button>
    </footer>
  );
}
