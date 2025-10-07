"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { joinVoice } from "../lib/agora";

/** ========== Types ========== */
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
  uid: string; // Agora UID (stringified)
  username?: string; // Optional display name
  muted?: boolean; // track publish state
  speaking?: boolean; // UI speaking indicator
  volume?: number; // 0..100 for UI
};

interface VoiceRoomPopupProps {
  isOpen: boolean; // Drawer visible state
  onClose: () => void; // Close only UI (do not leave room)
  slug: string; // Room slug for token/roster
}

/** ========== Utils ========== */
function normalizeUser(raw: any): Me {
  const u = raw?.user ?? raw?.data ?? raw ?? {};
  return {
    id: u.id ?? u.documentId ?? u._id,
    username: u.username ?? u.name ?? u.fullName ?? u.displayName ?? u.nickname,
    name: u.name ?? u.fullName ?? u.displayName,
    email: u.email,
  };
}

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function safeLocalStorage<T>(
  key: string,
  parse: (s: string) => T,
  fallback: T
): [() => T, (v: T) => void] {
  const get = () => {
    try {
      const s = localStorage.getItem(key);
      if (!s) return fallback;
      return parse(s);
    } catch {
      return fallback;
    }
  };
  const set = (v: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  };
  return [get, set];
}

/** ========== Component ========== */
export default function VoiceRoomPopup({
  isOpen,
  onClose,
  slug,
}: VoiceRoomPopupProps) {
  /** ===== Core states ===== */
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deaf, setDeaf] = useState(false); // stop playing remote audio but keep publishing
  const [peers, setPeers] = useState<Peer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<Me | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);

  // Lobby-only
  const [lobbyRoster, setLobbyRoster] = useState<Peer[] | null>(null);
  const [lobbyRosterEnabled, setLobbyRosterEnabled] = useState<boolean>(true);

  // Devices
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string | undefined>(
    undefined
  );

  const clientRef = useRef<any>(null);
  const micRef = useRef<any>(null); // LocalMicrophoneTrack
  const remoteTracksRef = useRef<Map<string, any>>(new Map()); // uid -> RemoteAudioTrack
  // Track the exact session id we created/activated
  const sessionIdRef = useRef<number | string | null>(null);

  // Push-to-talk
  const pttHeldRef = useRef(false);

  // Speaking polling timers
  const speakingTimerRef = useRef<NodeJS.Timer | null>(null);

  // Persisted prefs
  const [getPrefs, setPrefs] = safeLocalStorage(
    "voice:prefs",
    (s) => JSON.parse(s),
    { muted: false, deaf: false, micId: undefined as string | undefined }
  );
  useEffect(() => {
    const p = getPrefs();
    if (typeof p.muted === "boolean") setMuted(p.muted);
    if (typeof p.deaf === "boolean") setDeaf(p.deaf);
    if (typeof p.micId === "string") setSelectedMicId(p.micId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPrefs({ muted, deaf, micId: selectedMicId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted, deaf, selectedMicId]);

  /** ===== Derived UI ===== */
  const myDisplayName = useMemo(() => {
    const n =
      me?.username ||
      me?.name ||
      (me?.email ? me.email.split("@")[0] : undefined);
    return n || (myUid ? `UID ${myUid}` : "Me");
  }, [me, myUid]);

  const myInitial = useMemo(
    () => myDisplayName?.trim?.()[0]?.toUpperCase?.() || "M",
    [myDisplayName]
  );

  // New: participant count (lobby vs stage)
  const participantCount = useMemo(() => {
    if (joined) return 1 + peers.filter((p) => p.uid !== "self").length;
    return lobbyRoster?.length ?? 0;
  }, [joined, peers, lobbyRoster]);

  /** ===== API calls ===== */
  const requestVoiceTokenBySlug =
    useCallback(async (): Promise<VoiceTokenResponse> => {
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

  const fetchUserByUid = useCallback(
    async (uid: string): Promise<string | null> => {
      try {
        // Try the dedicated user endpoint first
        const r = await fetch(
          `/api/voice/user?uid=${encodeURIComponent(uid)}`,
          { cache: "no-store" }
        );
        if (r.ok) {
          const data = await r.json();
          return data?.username || data?.name || data?.displayName || null;
        }

        // Fallback: Try to get username from roster data if available
        if (lobbyRoster) {
          const rosterUser = lobbyRoster.find((p) => p.uid === uid);
          if (rosterUser?.username) {
            return rosterUser.username;
          }
        }

        // If all else fails, return null to use UID fallback
        return null;
      } catch {
        return null;
      }
    },
    [lobbyRoster]
  );

  const pollRoster = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/voice/roster?slug=${encodeURIComponent(slug)}`,
        { cache: "no-store" }
      );
      if (!r.ok) throw new Error();
      const js = await r.json(); // expected: { users: Array<{ uid: string, username?: string, muted?: boolean }> }
      const list: Peer[] = (js?.users ?? []).map((u: any) => ({
        uid: String(u.uid),
        username: u.username,
        muted: !!u.muted,
      }));
      setLobbyRoster(list);
      setLobbyRosterEnabled(true);
    } catch {
      setLobbyRosterEnabled(false);
    }
  }, [slug]);

  /** ===== Mic test (Lobby) ===== */
  const [testLevel, setTestLevel] = useState(0); // 0..1
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAnalyserRef = useRef<AnalyserNode | null>(null);
  const testRAFRef = useRef<number | null>(null);

  const startMicTest = useCallback(async (deviceId?: string) => {
    try {
      stopMicTest();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId } : true,
      });
      testStreamRef.current = stream;
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      testAnalyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        // Root-mean-square
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length); // 0..~1
        setTestLevel(rms);
        testRAFRef.current = requestAnimationFrame(tick);
      };
      testRAFRef.current = requestAnimationFrame(tick);
    } catch (e) {
      // ignore
    }
  }, []);

  const stopMicTest = useCallback(() => {
    if (testRAFRef.current) cancelAnimationFrame(testRAFRef.current);
    testRAFRef.current = null;
    testAnalyserRef.current?.disconnect?.();
    testAnalyserRef.current = null;
    testStreamRef.current?.getTracks?.().forEach((t) => t.stop());
    testStreamRef.current = null;
    setTestLevel(0);
  }, []);

  /** ===== Device list ===== */
  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setMics(list.filter((d) => d.kind === "audioinput"));
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () =>
      navigator.mediaDevices?.removeEventListener?.(
        "devicechange",
        refreshDevices
      );
  }, [refreshDevices]);

  /** ===== Peer helpers ===== */
  const addOrUpdatePeer = useCallback(
    (uid: string, patch: Partial<Peer> = {}) => {
      setPeers((prev) => {
        const i = prev.findIndex((p) => p.uid === uid);
        if (i === -1) return [...prev, { uid, volume: 100, ...patch }];
        const copy = [...prev];
        copy[i] = { ...copy[i], ...patch };
        return copy;
      });
    },
    []
  );

  const addOrUpdatePeerWithUsername = useCallback(
    async (uid: string, patch: Partial<Peer> = {}) => {
      // First add the peer immediately
      addOrUpdatePeer(uid, patch);

      // Then fetch username if not provided
      if (!patch.username) {
        const username = await fetchUserByUid(uid);
        if (username) {
          addOrUpdatePeer(uid, { username });
        }
      }
    },
    [addOrUpdatePeer, fetchUserByUid]
  );

  const setPeerMuted = useCallback((uid: string, isMuted: boolean) => {
    setPeers((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, muted: isMuted } : p))
    );
  }, []);

  const markPeerSpeaking = useCallback((uid: string, speaking: boolean) => {
    setPeers((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, speaking } : p))
    );
  }, []);

  const removePeer = useCallback((uid: string) => {
    setPeers((prev) => prev.filter((p) => p.uid !== uid));
    const track = remoteTracksRef.current.get(uid);
    try {
      track?.stop?.();
    } catch {}
    remoteTracksRef.current.delete(uid);
  }, []);

  const registerSession = useCallback(
    async (agoraUid: string, initMuted: boolean) => {
      try {
        const res = await fetch("/api/voice/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, agoraUid, muted: initMuted }),
        });
        // Capture id of the created/updated session
        const js = await res.json().catch(() => null);
        const id = js?.data?.id ?? js?.id;
        if (id != null) sessionIdRef.current = id;
      } catch (e) {
        /* no-op */
      }
    },
    [slug]
  );

  // Re-add: PATCH muted instead of deleting session
  const patchMutedSession = useCallback(
    async (agoraUid: string, mutedVal: boolean) => {
      try {
        await fetch("/api/voice/session", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, agoraUid, muted: mutedVal }),
        });
      } catch (e) {
        /* no-op */
      }
    },
    [slug]
  );

  // Prefer deleting by id on unload; fallback to slug/agoraUid only if id missing
  const deregisterSessionKeepalive = useCallback(
    (agoraUid: string) => {
      try {
        const url = `/api/voice/session?slug=${encodeURIComponent(
          slug
        )}&agoraUid=${encodeURIComponent(agoraUid)}&hard=1`;
        fetch(url, { method: "DELETE", keepalive: true }).catch(() => {});
      } catch {
        /* no-op */
      }
    },
    [slug]
  );

  /** ===== Join ===== */
  const handleJoin = useCallback(async () => {
    try {
      setError(null);
      setJoining(true);

      // Stop lobby mic test when joining
      stopMicTest();

      const { appId, channelName, token, uid } =
        await requestVoiceTokenBySlug();
      setMyUid(String(uid));

      const { client, micTrack } = await joinVoice({
        appId,
        channelName,
        token,
        uid,
      });
      clientRef.current = client;
      micRef.current = micTrack;

      // Apply initial mute/deaf prefs
      await micTrack.setEnabled(!muted);
      // deaf applies to remote playback; handled in subscribe path

      // Events
      client.on("user-joined", (user: any) =>
        addOrUpdatePeerWithUsername(String(user.uid))
      );

      client.on(
        "user-published",
        async (user: any, mediaType: "audio" | "video") => {
          try {
            const uidStr = String(user.uid);
            addOrUpdatePeerWithUsername(uidStr);
            await client.subscribe(user, mediaType);
            if (mediaType === "audio") {
              const aTrack = user.audioTrack;
              remoteTracksRef.current.set(uidStr, aTrack);
              if (deaf) {
                aTrack.setVolume(0);
              } else {
                aTrack.setVolume(100);
                aTrack.play();
              }
              setPeerMuted(uidStr, false);
            }
          } catch (err) {
            console.error("subscribe failed:", err);
          }
        }
      );

      client.on(
        "user-unpublished",
        (user: any, mediaType: "audio" | "video") => {
          if (mediaType === "audio") {
            const uidStr = String(user.uid);
            setPeerMuted(uidStr, true);
            const tr = remoteTracksRef.current.get(uidStr);
            try {
              tr?.stop?.();
            } catch {}
          }
        }
      );

      client.on("user-left", (user: any) => removePeer(String(user.uid)));

      // Hydrate existing
      for (const user of client.remoteUsers ?? []) {
        const uidStr = String(user.uid);
        addOrUpdatePeerWithUsername(uidStr, { muted: !(user as any).hasAudio });
        try {
          if ((user as any).hasAudio) {
            await client.subscribe(user, "audio");
            const aTrack = (user as any).audioTrack;
            remoteTracksRef.current.set(uidStr, aTrack);
            if (deaf) {
              aTrack.setVolume(0);
            } else {
              aTrack.setVolume(100);
              aTrack.play();
            }
            setPeerMuted(uidStr, false);
          }
        } catch (err) {
          console.error("hydrate subscribe failed:", err);
        }
      }

      setJoined(true);
      fetchMe()
        .then((u) => u && setMe(u))
        .catch(() => {});

      try {
        await registerSession(String(uid), muted);
      } catch {}

      // Start speaking polling (self + remotes)
      if (speakingTimerRef.current)
        clearInterval(speakingTimerRef.current as any);
      speakingTimerRef.current = setInterval(() => {
        // Self speaking
        const selfLevel = (micRef.current?.getVolumeLevel?.() ?? 0) as number; // 0..1
        // threshold ~ 0.05
        markPeerSpeaking("self", selfLevel > 0.05 && !muted);

        // Remote speaking
        for (const [uid, track] of remoteTracksRef.current.entries()) {
          const level = (track?.getVolumeLevel?.() ?? 0) as number;
          markPeerSpeaking(uid, level > 0.05 && !deaf);
        }
      }, 200);
    } catch (e: any) {
      const msg = e?.message || "Join failed";
      setError(msg);
      alert(msg);
    } finally {
      setJoining(false);
    }
  }, [
    requestVoiceTokenBySlug,
    addOrUpdatePeerWithUsername,
    setPeerMuted,
    removePeer,
    fetchMe,
    deaf,
    muted,
    selectedMicId,
    stopMicTest,
    markPeerSpeaking,
    registerSession,
  ]);

  /** ===== Leave (explicit only) ===== */
  const handleLeave = useCallback(async (myUid: string) => {
    try {

      await deregisterSessionKeepalive(myUid);


      if (micRef.current) {
        await micRef.current.setEnabled(false);
        micRef.current.close?.();
      }
      if (clientRef.current) {
        clientRef.current.removeAllListeners?.();
        await clientRef.current.leave();
      }
    } finally {
      clientRef.current = null;
      micRef.current = null;
      remoteTracksRef.current.forEach((t) => {
        try {
          t.stop?.();
        } catch {}
      });
      remoteTracksRef.current.clear();
      setPeers([]);
      setJoined(false);
      // muted/deaf persist by design
      setMe(null);
      setMyUid(null);
      // clear persisted session id so we don't try to reuse it
      sessionIdRef.current = null;
      if (speakingTimerRef.current) {
        clearInterval(speakingTimerRef.current as any);
        speakingTimerRef.current = null;
      }
    }
  }, [deregisterSessionKeepalive]);

  /** ===== Close UI only (keep session) ===== */
  const handleClose = useCallback(() => {
    onClose(); // do not leave room
  }, [onClose]);

  /** ===== Mute / Deafen / Push-to-talk ===== */
  const toggleMute = useCallback(async () => {
    if (!micRef.current) {
      // allow toggling pre-join as preference
      setMuted((m) => !m);
      return;
    }
    const next = !muted;
    await micRef.current.setEnabled(!next);
    setMuted(next);
    // persist muted state instead of deleting the session
    if (myUid) {
      try {
        await patchMutedSession(myUid, next);
      } catch {}
    }
  }, [muted, myUid, patchMutedSession]);

  const toggleDeaf = useCallback(async () => {
    const next = !deaf;
    setDeaf(next);
    // Apply to remote tracks
    for (const [, track] of remoteTracksRef.current.entries()) {
      try {
        track.setVolume(next ? 0 : 100);
        if (!next) track.play?.();
      } catch {}
    }
  }, [deaf]);

  const handlePTTDown = useCallback(async () => {
    if (pttHeldRef.current) return;
    pttHeldRef.current = true;
    if (muted && micRef.current) {
      await micRef.current.setEnabled(true);
    }
  }, [muted]);

  const handlePTTUp = useCallback(async () => {
    if (!pttHeldRef.current) return;
    pttHeldRef.current = false;
    if (muted && micRef.current) {
      await micRef.current.setEnabled(false);
    }
  }, [muted]);

  // New: global keyboard shortcuts (J join, M mute, D deafen, Space PTT, Esc close)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (joined) handlePTTDown();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "j" && !joined && !joining) handleJoin();
      if (k === "m" && joined) toggleMute();
      if (k === "d" && joined) toggleDeaf();
      if (k === "escape") handleClose();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (joined) handlePTTUp();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isOpen, joined, joining, handleJoin, toggleMute, toggleDeaf, handleClose, handlePTTDown, handlePTTUp]);

  /** ===== Mount / Unmount ===== */
  useEffect(() => {
    fetchMe()
      .then((u) => u && setMe(u))
      .catch(() => {});
    // Clean up ONLY when component unmounts (closing drawer via isOpen will not unmount)
    return () => {
      // If you want to auto-leave on hard unmount (route change), keep this:
      //void handleLeave(myUid);
      stopMicTest();
      if (speakingTimerRef.current) {
        clearInterval(speakingTimerRef.current as any);
        speakingTimerRef.current = null;
      }
    };
  }, [fetchMe, handleLeave, stopMicTest]);

  /** ===== Lobby roster polling ===== */
  useEffect(() => {
    if (!isOpen || joined === true) return;
    let t: NodeJS.Timeout | null = null;
    const run = async () => {
      await pollRoster();
    };
    run();
    t = setInterval(run, 5000);
    return () => {
      if (t) clearInterval(t);
    };
  }, [isOpen, joined, pollRoster]);

  /** ===== Mic test auto-start in lobby ===== */
  useEffect(() => {
    if (isOpen && !joined) startMicTest(selectedMicId);
    return () => {
      stopMicTest();
    };
  }, [isOpen, joined, selectedMicId, startMicTest, stopMicTest]);

  /** ===== UI ===== */
  const levelBarWidth = Math.min(100, Math.round(testLevel * 140)); // VU exaggeration

  return createPortal(
    <>
      {/* คลิกพื้นหลังได้ (pointer-events-none) และจะไม่ปิด Drawer */}
      <div className="fixed inset-0 z-40 pointer-events-none" />

      {/* Drawer ขวา */}
      <aside
        className={classNames(
          // palette: bg -> #F9F7F7
          "fixed inset-y-0 right-0 z-50 h-full w-[28%] min-w-[340px] max-w-[560px] bg-[#F9F7F7] shadow-xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          "pointer-events-auto"
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className={
              // palette: border/surface gradient -> #DBE2EF -> #F9F7F7
              "flex items-center justify-between border-b border-[#DBE2EF] p-4 bg-gradient-to-r from-[#DBE2EF] to-[#F9F7F7]"
            }
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  // badge chip in header
                  "inline-flex h-6 w-6 items-center justify-center rounded bg-[#DBE2EF] text-[#3F72AF] text-xs font-semibold"
                }
              >
                VR
              </span>
              <h2 className="text-lg font-semibold text-[#112D4E]">Voice Room</h2>
              {joined ? (
                <span className="ml-2 rounded bg-[#DBE2EF] px-2 py-0.5 text-xs font-medium text-[#112D4E]">
                  Live
                </span>
              ) : (
                <span className="ml-2 rounded bg-[#DBE2EF] px-2 py-0.5 text-xs font-medium text-[#3F72AF]">
                  Lobby
                </span>
              )}
              {/* slug + count */}
              <span className="ml-2 text-xs text-[#112D4E]/70">#{slug}</span>
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#DBE2EF] px-2 py-0.5 text-xs text-[#112D4E]">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-9 7a6 6 0 1 1 12 0v1H7v-1Z" />
                </svg>
                {participantCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Removed deafen from header */}
              {/* Close UI (keep session) */}
              <button
                onClick={handleClose}
                className="rounded-full p-1 hover:bg-[#DBE2EF] focus:outline-none focus:ring-2 focus:ring-[#3F72AF] focus:ring-offset-2"
                aria-label="Close"
                type="button"
                title="Close (Esc)"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {!joined ? (
              <>
                {/* ===== LOBBY ===== */}
                <div className="rounded-lg border border-[#DBE2EF] p-4 bg-[#F9F7F7]">
                  <h3 className="mb-3 text-sm font-semibold text-[#112D4E]">Audio setup</h3>

                  {/* Mic selector */}
                  <label className="mb-2 block text-xs font-medium text-[#112D4E]/80">Microphone</label>
                  <div className="flex items-center gap-2">
                    <select
                      className="w-full rounded border border-[#DBE2EF] px-2 py-1.5 text-sm bg-[#F9F7F7]"
                      value={selectedMicId || ""}
                      onChange={(e) => setSelectedMicId(e.target.value || undefined)}
                    >
                      <option value="">Default microphone</option>
                      {mics.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Mic ${d.deviceId.slice(0, 6)}...`}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => startMicTest(selectedMicId)}
                      className="rounded border border-[#DBE2EF] px-2 py-1.5 text-sm hover:bg-[#DBE2EF]"
                      type="button"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => stopMicTest()}
                      className="rounded border border-[#DBE2EF] px-2 py-1.5 text-sm hover:bg-[#DBE2EF]"
                      type="button"
                    >
                      Stop
                    </button>
                  </div>

                  {/* VU meter */}
                  <div className="mt-3 h-2 w-full rounded bg-[#DBE2EF] overflow-hidden">
                    <div
                      className="h-2 rounded bg-gradient-to-r from-[#DBE2EF] to-[#3F72AF] transition-[width] duration-100"
                      style={{ width: `${levelBarWidth}%` }}
                    />
                  </div>

                  {/* Mute preference */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setMuted((m) => !m)}
                      className={classNames(
                        "inline-flex items-center gap-1 rounded border border-[#DBE2EF] px-2 py-1.5 text-sm",
                        muted ? "bg-[#3F72AF] text-white" : "hover:bg-[#DBE2EF]"
                      )}
                      type="button"
                      title="Mute on join"
                    >
                      {muted ? "Muted on join" : "Unmuted on join"}
                    </button>
                  </div>
                </div>

                {/* Lobby roster (optional) */}
                {lobbyRosterEnabled && (
                  <div className="rounded-lg border border-[#DBE2EF] p-4 bg-[#F9F7F7]">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#112D4E]">People in room</h3>
                      <button
                        onClick={pollRoster}
                        className="rounded border border-[#DBE2EF] px-2 py-1 text-xs hover:bg-[#DBE2EF]"
                        type="button"
                      >
                        Refresh
                      </button>
                    </div>
                    {lobbyRoster && lobbyRoster.length > 0 ? (
                      <div className="flex flex-wrap gap-4">
                        {lobbyRoster.map((p) => {
                          const label = p.username ?? `UID ${String(p.uid)}`;
                          const initial = (p.username ?? String(p.uid))
                            .slice(0, 1)
                            .toUpperCase();
                          const isMuted = p.muted ?? true;
                          return (
                            <div
                              key={`lobby-${p.uid}`}
                              className="flex flex-col items-center transition-transform duration-150 hover:scale-105"
                            >
                              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#3F72AF] text-white">
                                <span className="text-sm font-semibold">
                                  {initial}
                                </span>
                                <div
                                  className={classNames(
                                    "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white",
                                    (p.muted ?? true)
                                      ? // muted
                                        "bg-[#DBE2EF] text-[#3F72AF]"
                                      : // unmuted
                                        "bg-[#3F72AF] text-white"
                                  )}
                                  title={(p.muted ?? true) ? "Muted" : "Unmuted"}
                                >
                                  {p.muted ?? true ? <MicOffIcon size={12} /> : <MicOnIcon size={12} />}
                                </div>
                              </div>
                              <span className="mt-1 max-w-[6rem] truncate text-xs text-[#112D4E]">
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-[#112D4E]/70">
                        ยังไม่มีใคร หรือปิด roster API
                      </p>
                    )}
                  </div>
                )}

                {/* Join controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleJoin}
                    disabled={joining || joined}
                    className="rounded-lg bg-[#3F72AF] px-3 py-2 text-sm text-white hover:brightness-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#3F72AF] focus:ring-offset-2"
                    type="button"
                    title="Join (J)"
                  >
                    {joining ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                        กำลังเข้าร่วม…
                      </span>
                    ) : (
                      "เข้าร่วม"
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <kbd className="rounded bg-[#DBE2EF] px-1.5 py-0.5 text-xs">J</kbd>
                    <span className="text-xs text-[#112D4E]/70">Join</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* ===== STAGE ===== */}
                <div className="rounded-xl border border-[#DBE2EF] bg-gradient-to-br from-[#DBE2EF] to-[#F9F7F7] p-4">
                  <div className="flex flex-wrap gap-4">
                    {/* Myself */}
                    <UserBubble
                      uid="self"
                      name={myDisplayName}
                      initial={myInitial}
                      muted={muted}
                      speaking={peers.find((p) => p.uid === "self")?.speaking}
                      deaf={deaf}
                      self
                    />
                    {/* Peers */}
                    {peers
                      .filter((p) => p.uid !== "self")
                      .map((p) => {
                        const label = p.username || `User ${String(p.uid).slice(-4)}`;
                        const initial = p.username
                          ? p.username.slice(0, 1).toUpperCase()
                          : String(p.uid).slice(0, 1).toUpperCase();
                        const isMuted = p.muted ?? true;
                        return (
                          <UserBubble
                            key={p.uid}
                            uid={p.uid}
                            name={label}
                            initial={initial}
                            muted={isMuted}
                            speaking={p.speaking}
                          />
                        );
                      })}
                  </div>
                </div>

                {/* Controls: left (mic + deafen), right (PTT + Leave) */}
                <div className="flex items-center justify-between">
                  {/* Left horizontal: mic + deafen */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className={classNames(
                        "h-10 w-10 rounded-full border border-[#DBE2EF] shadow flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#3F72AF] focus:ring-offset-2",
                        !joined
                          ? "bg-[#DBE2EF] text-[#112D4E]/40 cursor-not-allowed"
                          : muted
                          ? "bg-[#DBE2EF] text-[#3F72AF]"
                          : "bg-[#3F72AF] text-white"
                      )}
                      aria-pressed={muted}
                      aria-label={muted ? "Unmute mic" : "Mute mic"}
                      type="button"
                      title="Mute (M) / Push-to-talk (Space)"
                    >
                      {muted ? <MicOffIcon size={18} /> : <MicOnIcon size={18} />}
                    </button>

                    <button
                      onClick={toggleDeaf}
                      className={classNames(
                        "h-10 w-10 rounded-full border border-[#DBE2EF] shadow flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#3F72AF] focus:ring-offset-2",
                        deaf ? "bg-[#3F72AF] text-white" : "bg-[#F9F7F7] hover:bg-[#DBE2EF] text-[#112D4E]"
                      )}
                      title={deaf ? "Undeafen (D)" : "Deafen (D)"}
                      type="button"
                    >
                      <HeadphonesIcon size={18} />
                    </button>
                  </div>

                  {/* Right: PTT + Leave */}
                  <div className="flex items-center gap-2">
                    <button
                      onMouseDown={handlePTTDown}
                      onMouseUp={handlePTTUp}
                      onMouseLeave={handlePTTUp}
                      disabled={!joined}
                      className={classNames(
                        "rounded-lg px-3 py-2 text-sm border border-[#DBE2EF] focus:outline-none focus:ring-2 focus:ring-[#3F72AF] focus:ring-offset-2",
                        joined ? "hover:bg-[#DBE2EF]" : "opacity-50 cursor-not-allowed"
                      )}
                      type="button"
                      title="Hold to talk (Space)"
                    >
                      Push-to-talk
                    </button>

                    <button
                      onClick={() => { if (myUid) void handleLeave(myUid); }}
                      disabled={!joined && !joining}
                      className="rounded-lg bg-[#3F72AF] px-3 py-2 text-sm text-white hover:brightness-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#3F72AF] focus:ring-offset-2"
                      type="button"
                    >
                      ออกจากห้อง
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
}

/** ========== Small UI helpers ========== */
function MicOnIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-4.08A7 7 0 0 0 19 11h-2Z" />
    </svg>
  );
}
function MicOffIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-7.586 4.243l1.43-1.43A3 3 0 0 0 17 11a1 1 0 1 0 2 0ZM12 3a3 3 0 0 0-3 3v4.586l5.293-5.293A2.988 2.988 0 0 0 12 3ZM4.293 20.707a1 1 0 0 1 0-1.414l14-14a1 1 0 1 1 1.414 1.414l-2.555 2.555A4.984 4.984 0 0 1 17 11a5.002 5.002 0 0 1-5 5 4.984 4.984 0 0 1-1.738-.308l-1.9 1.9A6.974 6.974 0 0 0 11 19.93V22h2v-2.07A6.996 6.996 0 0 0 18.071 17l1.636-1.636a1 1 0 1 1 1.414 1.414L19.485 18.414a8.985 8.985 0 0 1-6.485 2.586A8.984 8.984 0 0 1 6.586 19.485l-1.879 1.879a1 1 0 0 1-1.414 0Z" />
    </svg>
  );
}
function HeadphonesIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h1v-8H6a7 7 0 0 1 14 0h-1v8h1a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function UserBubble({
  uid,
  name,
  initial,
  muted,
  speaking,
  self = false,
  deaf, // new: show deafen state on self
}: {
  uid: string;
  name: string;
  initial: string;
  muted?: boolean;
  speaking?: boolean;
  self?: boolean;
  deaf?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={classNames(
          "relative flex h-14 w-14 items-center justify-center rounded-full text-white ring-2 ring-offset-2 ring-offset-[#F9F7F7] shadow-sm",
          self ? "bg-[#112D4E] ring-[#3F72AF]" : "bg-[#3F72AF] ring-[#DBE2EF]",
          speaking ? "animate-pulse ring-4 ring-[#3F72AF]" : ""
        )}
        title={name}
      >
        {/* speaking dot */}
        {speaking && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#3F72AF] ring-2 ring-white" />
        )}
        <span className="text-sm font-semibold">{initial}</span>
        {/* removed bottom-right overlay badges */}
      </div>

      {/* status badges row between avatar and name */}
      <div className="mt-1 flex items-center justify-center gap-1">
        <span
          className={classNames(
            "flex h-5 w-5 items-center justify-center rounded-full border border-white",
            muted ? "bg-[#DBE2EF] text-[#3F72AF]" : "bg-[#3F72AF] text-white"
          )}
          title={muted ? "Muted" : "Unmuted"}
        >
          {muted ? <MicOffIcon size={12} /> : <MicOnIcon size={12} />}
        </span>
        {self && (
          <span
            className={classNames(
              "flex h-5 w-5 items-center justify-center rounded-full border border-white",
              deaf ? "bg-[#DBE2EF] text-[#3F72AF]" : "bg-[#3F72AF] text-white"
            )}
            title={deaf ? "Deafened" : "Listening"}
          >
            <HeadphonesIcon size={12} />
          </span>
        )}
      </div>

      <span className="mt-1 max-w-[7rem] truncate text-xs text-[#112D4E]">
        {name}
      </span>
    </div>
  );
}
