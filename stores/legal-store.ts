import { create } from "zustand";

const KEY = "coastline-drive:legal-accepted";

type Doc = "terms" | "privacy" | null;

interface LegalStore {
  accepted: boolean;
  openDoc: Doc;
  /** Read the stored consent AFTER mount — see the note below. */
  hydrate: () => void;
  accept: () => void;
  open: (doc: Exclude<Doc, null>) => void;
  close: () => void;
}

/**
 * Starts as `accepted: true` on BOTH server and client so the first client
 * render matches the SSR HTML exactly; the real value is read from
 * localStorage in an effect (see Legal). Reading storage during store creation
 * made the banner appear on the client but not the server, which failed
 * hydration and forced React to re-render the whole tree.
 */
export const useLegalStore = create<LegalStore>((set) => ({
  accepted: true,
  openDoc: null,
  hydrate: () => {
    try {
      set({ accepted: window.localStorage.getItem(KEY) === "1" });
    } catch {
      set({ accepted: false });
    }
  },
  accept: () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    set({ accepted: true });
  },
  open: (doc) => set({ openDoc: doc }),
  close: () => set({ openDoc: null }),
}));
