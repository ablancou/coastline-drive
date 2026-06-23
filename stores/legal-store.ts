import { create } from "zustand";

const KEY = "coastline-drive:legal-accepted";

type Doc = "terms" | "privacy" | null;

function loadAccepted(): boolean {
  if (typeof window === "undefined") return true; // never show during SSR
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

interface LegalStore {
  accepted: boolean;
  openDoc: Doc;
  accept: () => void;
  open: (doc: Exclude<Doc, null>) => void;
  close: () => void;
}

export const useLegalStore = create<LegalStore>((set) => ({
  accepted: loadAccepted(),
  openDoc: null,
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
