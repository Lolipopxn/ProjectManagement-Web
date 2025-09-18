"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { joinVoice } from "../lib/agora";

type VoiceTokenResponse = {
  appId: string;
  channelName: string;
  uid: string | number;
  token: string;
  expiresAt?: number;
  projectId?: number;
};

type Me = {
  id?: number | string;
  username?: string;
  name?: string;
  email?: string;
};

type Peer = {
  uid: string;
  username?: string;
  muted?: boolean; // true = ปิดไมค์
};

interface VoiceRoomPopupProps {
  isOpen: boolean;
  onClose: () => void; // ปิดเฉพาะ UI
  slug: string;
}

function normalizeUser(raw: any): Me {
  const u = raw?.user ?? raw?.data ?? raw ?? {};
  return {
    id: u.id ?? u.documentId ?? u._id,
    username: u.username ?? u.name ?? u.fullName ?? u.displayName ?? u.nickname,
    name: u.name ?? u.fullName ?? u.displayName,
    email: u.email,
  };
}

export default function VoiceRoomPopup({
  isOpen,
  onClose,
  slug,
}: VoiceRoomPopupProps) {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<Me | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);

  const clientRef = useRef<any>(null);
  const micRef = useRef<any>(null);

  const myDisplayName = useMemo(() => {
    const n =
      me?.username ||
      me?.name ||
      (me?.email ? me.email.split("@")[0] : undefined);
    return n || (myUid ? `UID ${myUid}` : "Me");
  }, [me, myUid]);

  const myInitial = useMemo(
    () => (myDisplayName?.trim?.()[0]?.toUpperCase?.() || "M"),
    [myDisplayName]
  );

  const requestVoiceTokenBySlug = useCallback(async (): Promise<VoiceTokenResponse> => {
    const res = await fetch("/api/voice/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, [slug]);

  const fetchMe = useCallback(async (): Promise<Me | null> => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      if (!r.ok) return null;
      const raw = await r.json();
      return normalizeUser(raw);
    } catch {
      return null;
    }
  }, []);

  // ===== Peer helpers =====
  const addOrUpdatePeer = useCallback((uid: string, patch: Partial<Peer> = {}) => {
    setPeers((prev) => {
      const i = prev.findIndex((p) => p.uid === uid);
      if (i === -1) return [...prev, { uid, ...patch }];
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  }, []);

  const setPeerMuted = useCallback((uid: string, isMuted: boolean) => {
    setPeers((prev) => prev.map((p) => (p.uid === uid ? { ...p, muted: isMuted } : p)));
  }, []);

  const removePeer = useCallback((uid: string) => {
    setPeers((prev) => prev.filter((p) => p.uid !== uid));
  }, []);

  // ===== Join / Leave =====
  const handleJoin = useCallback(async () => {
    try {
      setError(null);
      setJoining(true);

      const { appId, channelName, token, uid } = await requestVoiceTokenBySlug();
      setMyUid(String(uid));

      const { client, micTrack } = await joinVoice({ appId, channelName, token, uid });
      clientRef.current = client;
      micRef.current = micTrack;

      // remote joined
      client.on("user-joined", (user: any) => {
        addOrUpdatePeer(String(user.uid));
      });

      // remote publish (audio)
      client.on("user-published", async (user: any, mediaType: "audio" | "video") => {
        try {
          addOrUpdatePeer(String(user.uid));
          await client.subscribe(user, mediaType);
          if (mediaType === "audio") {
            user.audioTrack?.play();
            setPeerMuted(String(user.uid), false);
          }
        } catch (err) {
          console.error("subscribe failed:", err);
        }
      });

      // remote unpublish (audio) -> ไม่ลบ peer ออกจาก UI
      client.on("user-unpublished", (user: any, mediaType: "audio" | "video") => {
        if (mediaType === "audio") {
          setPeerMuted(String(user.uid), true);
        }
      });

      // remote left -> ค่อยลบ
      client.on("user-left", (user: any) => removePeer(String(user.uid)));

      // hydrate ผู้ที่อยู่ก่อนเราเข้ามา
      for (const user of client.remoteUsers ?? []) {
        const uidStr = String(user.uid);
        addOrUpdatePeer(uidStr, { muted: !(user as any).hasAudio });
        try {
          if ((user as any).hasAudio) {
            await client.subscribe(user, "audio");
            (user as any).audioTrack?.play();
            setPeerMuted(uidStr, false);
          }
        } catch (err) {
          console.error("hydrate subscribe failed:", err);
        }
      }

      setJoined(true);
      fetchMe().then((u) => u && setMe(u)).catch(() => {});
    } catch (e: any) {
      const msg = e?.message || "Join failed";
      setError(msg);
      alert(msg);
    } finally {
      setJoining(false);
    }
  }, [requestVoiceTokenBySlug, addOrUpdatePeer, setPeerMuted, removePeer, fetchMe]);

  const handleLeave = useCallback(async () => {
    try {
      if (micRef.current) {
        await micRef.current.setEnabled(false);
        micRef.current.close();
      }
      if (clientRef.current) {
        clientRef.current.removeAllListeners?.();
        await clientRef.current.leave();
      }
    } finally {
      clientRef.current = null;
      micRef.current = null;
      setPeers([]);
      setJoined(false);
      setMuted(false);
      setMe(null);
      setMyUid(null);
    }
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const toggleMute = useCallback(async () => {
    if (!micRef.current) return;
    const next = !muted;
    await micRef.current.setEnabled(!next);
    setMuted(next);
  }, [muted]);
  useEffect(() => {
    fetchMe().then((u) => u && setMe(u)).catch(() => {});
    return () => {
      void handleLeave();
    };
  }, [fetchMe, handleLeave]);


  return createPortal(
    <>
      <div className="fixed inset-0 z-40 pointer-events-none" />

      {/* Drawer ขวา */}
      <aside
        className={[
          "fixed inset-y-17 right-0 z-50 h-full w-[28%] bg-white shadow-xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          "pointer-events-auto",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Voice Room</h2>
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-gray-100"
              aria-label="Close"
              type="button"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="h-64 rounded border bg-blue-50 p-4">
              <div className="flex flex-wrap gap-4">
                {/* Myself */}
                {joined && (
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-amber-200 ring-2 ring-amber-400">
                      <span className="text-sm font-semibold">{myInitial}</span>
                      {/* mic badge */}
                      <div
                        className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white ${
                          muted ? "bg-gray-500 text-white" : "bg-blue-600 text-white"
                        }`}
                        title={muted ? "Muted" : "Unmuted"}
                      >
                        {muted ? (
                          // mic-off
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                            <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-7.586 4.243l1.43-1.43A3 3 0 0 0 17 11a1 1 0 1 0 2 0ZM12 3a3 3 0 0 0-3 3v4.586l5.293-5.293A2.988 2.988 0 0 0 12 3ZM4.293 20.707a1 1 0 0 1 0-1.414l14-14a1 1 0 1 1 1.414 1.414l-2.555 2.555A4.984 4.984 0 0 1 17 11a5.002 5.002 0 0 1-5 5 4.984 4.984 0 0 1-1.738-.308l-1.9 1.9A6.974 6.974 0 0 0 11 19.93V22h2v-2.07A6.996 6.996 0 0 0 18.071 17l1.636-1.636a1 1 0 1 1 1.414 1.414L19.485 18.414a8.985 8.985 0 0 1-6.485 2.586A8.984 8.984 0 0 1 6.586 19.485l-1.879 1.879a1 1 0 0 1-1.414 0Z"/>
                          </svg>
                        ) : (
                          // mic-on
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-4.08A7 7 0 0 0 19 11h-2Z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="mt-1 max-w-[6rem] truncate text-xs text-gray-700">
                      {myDisplayName}
                    </span>
                  </div>
                )}

                {/* Peers */}
                {peers.map((p) => {
                  const label = p.username ?? `UID ${String(p.uid)}`;
                  const initial = (p.username ?? String(p.uid)).slice(0, 1).toUpperCase();
                  const isMuted = p.muted ?? true;
                  return (
                    <div key={p.uid} className="flex flex-col items-center">
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
                        <span className="text-sm font-semibold">{initial}</span>
                        <div
                          className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white ${
                            isMuted ? "bg-gray-500 text-white" : "bg-blue-600 text-white"
                          }`}
                          title={isMuted ? "Muted" : "Unmuted"}
                        >
                          {isMuted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                              <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-7.586 4.243l1.43-1.43A3 3 0 0 0 17 11a1 1 0 1 0 2 0ZM12 3a3 3 0 0 0-3 3v4.586l5.293-5.293A2.988 2.988 0 0 0 12 3ZM4.293 20.707a1 1 0 0 1 0-1.414l14-14a1 1 0 1 1 1.414 1.414l-2.555 2.555A4.984 4.984 0 0 1 17 11a5.002 5.002 0 0 1-5 5 4.984 4.984 0 0 1-1.738-.308l-1.9 1.9A6.974 6.974 0 0 0 11 19.93V22h2v-2.07A6.996 6.996 0 0 0 18.071 17l1.636-1.636a1 1 0 1 1 1.414 1.414L19.485 18.414a8.985 8.985 0 0 1-6.485 2.586A8.984 8.984 0 0 1 6.586 19.485l-1.879 1.879a1 1 0 0 1-1.414 0Z"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-4.08A7 7 0 0 0 19 11h-2Z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="mt-1 max-w-[6rem] truncate text-xs text-gray-700">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleJoin}
                  disabled={joining || joined}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                  type="button"
                >
                  เข้าร่วม
                </button>

                <button
                  onClick={toggleMute}
                  disabled={!joined}
                  className={`h-10 w-10 rounded-full border shadow flex items-center justify-center
                    ${!joined ? "bg-gray-300 text-gray-500 cursor-not-allowed" : muted ? "bg-gray-600 text-white" : "bg-blue-600 text-white"}
                  `}
                  aria-pressed={muted}
                  aria-label={muted ? "Unmute mic" : "Mute mic"}
                  type="button"
                >
                  {muted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-7.586 4.243l1.43-1.43A3 3 0 0 0 17 11a1 1 0 1 0 2 0ZM12 3a3 3 0 0 0-3 3v4.586l5.293-5.293A2.988 2.988 0 0 0 12 3ZM4.293 20.707a1 1 0 0 1 0-1.414l14-14a1 1 0 1 1 1.414 1.414l-2.555 2.555A4.984 4.984 0 0 1 17 11a5.002 5.002 0 0 1-5 5 4.984 4.984 0 0 1-1.738-.308l-1.9 1.9A6.974 6.974 0 0 0 11 19.93V22h2v-2.07A6.996 6.996 0 0 0 18.071 17l1.636-1.636a1 1 0 1 1 1.414 1.414L19.485 18.414a8.985 8.985 0 0 1-6.485 2.586A8.984 8.984 0 0 1 6.586 19.485l-1.879 1.879a1 1 0 0 1-1.414 0Z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-4.08A7 7 0 0 0 19 11h-2Z"/>
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleLeave}
                  disabled={!joined && !joining}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  type="button"
                >
                  ออก
                </button>
              </div>
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
}
