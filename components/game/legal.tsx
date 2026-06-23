"use client";

import { PRIVACY, TERMS, type LegalDoc } from "@/game/constants/legal";
import { useLegalStore } from "@/stores/legal-store";

/** Discreet consent banner + full-text legal modal. Mount once. */
export function Legal() {
  const accepted = useLegalStore((s) => s.accepted);
  const openDoc = useLegalStore((s) => s.openDoc);
  const accept = useLegalStore((s) => s.accept);
  const open = useLegalStore((s) => s.open);
  const close = useLegalStore((s) => s.close);

  const doc: LegalDoc | null = openDoc === "privacy" ? PRIVACY : openDoc === "terms" ? TERMS : null;

  return (
    <>
      {!accepted && (
        <div className="consent" role="dialog" aria-label="Aviso legal">
          <p className="consent__text">
            Usamos almacenamiento local solo para guardar tus mejores tiempos. Al continuar aceptas
            los{" "}
            <button className="consent__link" onClick={() => open("terms")}>
              Términos
            </button>{" "}
            y el{" "}
            <button className="consent__link" onClick={() => open("privacy")}>
              Aviso de Privacidad
            </button>
            .
          </p>
          <button className="consent__accept" onClick={accept}>
            Aceptar
          </button>
        </div>
      )}

      {doc && (
        <div className="legal" role="dialog" aria-modal="true" aria-label={doc.title} onClick={close}>
          <div className="legal__panel" onClick={(e) => e.stopPropagation()}>
            <header className="legal__head">
              <h2 className="legal__title">{doc.title}</h2>
              <button className="legal__close" onClick={close} aria-label="Cerrar">
                ✕
              </button>
            </header>
            <p className="legal__updated">Última actualización: {doc.updated}</p>
            <div className="legal__body">
              <p className="legal__intro">{doc.intro}</p>
              {doc.sections.map((s) => (
                <section key={s.heading} className="legal__section">
                  <h3 className="legal__heading">{s.heading}</h3>
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="legal__p">
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
