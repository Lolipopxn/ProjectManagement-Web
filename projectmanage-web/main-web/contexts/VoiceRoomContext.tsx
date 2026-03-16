"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

import dynamic from "next/dynamic";

const VoiceRoomPopup = dynamic(
  () => import("../app/components/VoiceRoomPopup"),
  { ssr: false }
);

type VoiceRoomContextType = {
  openVoiceRoom: (slug: string) => void;
  closeVoiceRoom: () => void;
  leaveVoiceRoom: () => void;

  isOpen: boolean;
  slug: string | null;
  joined: boolean;

  setJoined: (v: boolean) => void;
};

const VoiceRoomContext = createContext<VoiceRoomContextType | undefined>(
  undefined
);

const STORAGE_KEY = "voice:room";

export function VoiceRoomProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  /*RESTORE SESSION (important)*/

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);

      if (saved?.slug) {
        setSlug(saved.slug);
        setJoined(saved.joined ?? false);
      }
    } catch {}
  }, []);

  /*SAVE SESSION*/

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          slug,
          joined,
        })
      );
    } catch {}
  }, [slug, joined]);

  /*OPEN VOICE ROOM*/

  const openVoiceRoom = useCallback((s: string) => {
    setSlug(s);
    setIsOpen(true);
  }, []);

  /*CLOSE UI ONLY*/

  const closeVoiceRoom = useCallback(() => {
    setIsOpen(false);
  }, []);

  /*LEAVE ROOM*/
  const leaveVoiceRoom = useCallback(() => {
    setJoined(false);
    setSlug(null);
    setIsOpen(false);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      openVoiceRoom,
      closeVoiceRoom,
      leaveVoiceRoom,
      isOpen,
      slug,
      joined,
      setJoined,
    }),
    [openVoiceRoom, closeVoiceRoom, leaveVoiceRoom, isOpen, slug, joined]
  );

  return (
    <VoiceRoomContext.Provider value={value}>
      {children}

      {slug && (
        <VoiceRoomPopup
          isOpen={isOpen}
          onClose={closeVoiceRoom}
          onOpen={() => setIsOpen(true)}
          slug={slug}
        />
      )}
    </VoiceRoomContext.Provider>
  );
}

export function useVoiceRoom() {
  const ctx = useContext(VoiceRoomContext);

  if (!ctx)
    throw new Error("useVoiceRoom must be used within a VoiceRoomProvider");

  return ctx;
}