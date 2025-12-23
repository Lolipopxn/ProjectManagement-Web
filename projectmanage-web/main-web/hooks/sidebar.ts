"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarState {
  isNavOpen: boolean;
  toggleNav: () => void;
  setNavOpen: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isNavOpen: true,

      toggleNav: () =>
        set((state) => ({
          isNavOpen: !state.isNavOpen,
        })),

      setNavOpen: (v) =>
        set(() => ({
          isNavOpen: v,
        })),
    }),
    {
      name: "sidebar-state",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
