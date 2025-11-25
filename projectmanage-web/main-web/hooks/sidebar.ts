"use client";

import { create } from "zustand";

interface SidebarState {
  isNavOpen: boolean;
  toggleNav: () => void;
  setNavOpen: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isNavOpen: true,

  toggleNav: () =>
    set((state) => ({
      isNavOpen: !state.isNavOpen,
    })),

  setNavOpen: (v) =>
    set(() => ({
      isNavOpen: v,
    })),
}));
