"use client";

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";

const VoiceRoomPopup = dynamic(() => import("../app/components/VoiceRoomPopup"), { ssr: false });

type VoiceRoomContextType = {
  openVoiceRoom: (slug: string) => void;
  closeVoiceRoom: () => void;
  isOpen: boolean;
  slug: string | null;
};

const VoiceRoomContext = createContext<VoiceRoomContextType | undefined>(undefined);

export function VoiceRoomProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  const openVoiceRoom = useCallback((s: string) => {
    setSlug(s);
    setIsOpen(true);
  }, []);

  const closeVoiceRoom = useCallback(() => {
    setIsOpen(false);
    setSlug(null);
  }, []);

  const value = useMemo(() => ({ openVoiceRoom, closeVoiceRoom, isOpen, slug }), [
    openVoiceRoom,
    closeVoiceRoom,
    isOpen,
    slug,
  ]);

  return (
    <VoiceRoomContext.Provider value={value}>
      {children}
      {isOpen && slug && (
        <VoiceRoomPopup isOpen={isOpen} onClose={closeVoiceRoom} slug={slug} />
      )}
    </VoiceRoomContext.Provider>
  );
}

export function useVoiceRoom() {
  const ctx = useContext(VoiceRoomContext);
  if (!ctx) throw new Error("useVoiceRoom must be used within a VoiceRoomProvider");
  return ctx;
}
