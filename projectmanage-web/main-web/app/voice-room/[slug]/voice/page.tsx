"use client";
export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { joinVoice } from "../../../lib/agora";

type VoiceTokenResponse = {
  appId: string;
  channelName: string;
  uid: string;
  token: string;
  expiresAt?: number;
  projectId?: number;
};

export default function ProjectVoiceRoom() {
  const params = useParams() as { slug?: string | string[] };
  const slug = Array.isArray(params?.slug) ? params!.slug[0] : params?.slug;

  if (!slug) return <div className="p-4 text-red-600">Invalid room URL</div>;

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState<{ uid: string; name?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<any>(null);
  const micRef = useRef<any>(null);

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

  const handleJoin = useCallback(async () => {
    try {
      setError(null);
      setJoining(true);

      // เรียกผ่าน Next API → Next แนบ Bearer และ resolve slug → id ให้
      const { appId, channelName, token, uid } = await requestVoiceTokenBySlug();

      const { client, micTrack } = await joinVoice({ appId, channelName, token, uid });

      clientRef.current = client;
      micRef.current = micTrack;
      setJoined(true);

      client.on("user-published", async (user: any, mediaType: any) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack?.play();
        setPeers((p: any[]) =>
          p.some((x) => String(x.uid) === String(user.uid)) ? p : [...p, { uid: String(user.uid) }]
        );
      });

      const removePeer = (user: any) =>
        setPeers((p: any[]) => p.filter((x) => String(x.uid) !== String(user.uid)));

      client.on("user-unpublished", removePeer);
      client.on("user-left", removePeer);
    } catch (e: any) {
      const msg = e?.message || "Join failed";
      setError(msg);
      alert(msg);
    } finally {
      setJoining(false);
    }
  }, [requestVoiceTokenBySlug]);

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
    }
  }, []);

  useEffect(() => {
    return () => {
      // cleanup เมื่อออกจากหน้า
      void handleLeave();
    };
  }, [handleLeave]);

  const toggleMute = useCallback(async () => {
    if (!micRef.current) return;
    const next = !muted;
    await micRef.current.setEnabled(!next);
    setMuted(next);
  }, [muted]);

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold">Room</h1>

      <div className="mt-2 h-64 rounded border bg-blue-50 p-4">
        <div className="flex gap-4">
          {/* ตัวเอง */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200 ring-2 ring-amber-400">
            <span className="text-sm font-semibold">ME</span>
          </div>

          {/* peers */}
          {peers.map((p) => (
            <div
              key={p.uid}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white"
            >
              <span className="text-sm font-semibold">
                {String(p.uid).slice(0, 1).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {!joined ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            เข้าร่วม
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`rounded-lg px-4 py-2 text-white ${
                muted ? "bg-gray-500" : "bg-blue-600"
              } hover:opacity-90`}
            >
              {muted ? "ไมค์ปิด" : "ไมค์เปิด"}
            </button>
            <button
              onClick={handleLeave}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              ออก
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}