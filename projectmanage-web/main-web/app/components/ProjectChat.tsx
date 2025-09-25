"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import dayjs from "dayjs";
import { fetchMessages } from "../lib/strapi";

export type ProjectChatPopupProps = {
  projectSlug: string;
  projectName: string;
  getToken: string | null;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  currentUserId?: number;
  onUnreadChange?: (n: number) => void;
};

export default function ProjectChatPopup({
  projectSlug,
  projectName,
  getToken,
  open,
  onOpenChange,
  currentUserId,
  onUnreadChange,
}: ProjectChatPopupProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [othersTyping, setOthersTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const LS_KEY = `chat:lastSeen:${projectSlug}`;
  const unreadRef = useRef(0);
  const rawLastSeen = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
  const lastSeenRef = useRef<number>(rawLastSeen ? Number(rawLastSeen) : 0);

  const makeKey = (m: any) =>
    m.id != null ? `id-${m.id}` : m._key ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  // ⬇️ เปิด socket ตลอด (ไม่ผูกกับ open) เพื่อดักข้อความใหม่ตอนปิดอยู่
  useEffect(() => {
    const token = getToken;
    if (!token) return;

    fetch("/api/socket"); // init server path
    const s = io({ path: "/api/socket_io", auth: { token, projectSlug } });
    socketRef.current = s;

    s.on("message:new", (m: any) => {
      const withKey = { ...m, _key: makeKey(m) };
      setMessages((prev) => {
        const map = new Map(prev.map((x) => [x.id ?? x._key, x]));
        map.set(withKey.id ?? withKey._key, withKey);
        return Array.from(map.values()).sort(
          (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      // ถ้าป๊อปอัพปิดอยู่ และข้อความใหม่ใหม่กว่า lastSeen => เพิ่ม unread
      const created = new Date(m.createdAt).getTime();
      if (!open && created > lastSeenRef.current) {
        unreadRef.current += 1;
        onUnreadChange?.(unreadRef.current);
      }
    });

    s.on("typing", (t: { userId: number; state: boolean }) => {
      setOthersTyping(t.state);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [getToken, projectSlug]); // ไม่ขึ้นกับ open

  // ⬇️ ดึงข้อความเริ่มต้นครั้งแรก (หรือเมื่อ slug เปลี่ยน)
  useEffect(() => {
    (async () => {
      const token = getToken;
      if (!token) return;
      const initial = await fetchMessages(token, projectSlug, 50);
      const list = initial
        .map((m: any) => ({ ...m, _key: makeKey(m) }))
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(list);

      // คำนวณ unread จาก lastSeen เดิม
      const lastSeen = lastSeenRef.current || 0;
      const unread = list.reduce((acc, m) => {
        const ts = new Date(m.createdAt).getTime();
        return ts > lastSeen ? acc + 1 : acc;
      }, 0);
      unreadRef.current = unread;
      onUnreadChange?.(unread);
    })();
  }, [getToken, projectSlug]);

  // ⬇️ เมื่อเปิดป๊อปอัพ: เลื่อนล่าง + เคลียร์ unread + อัปเดต lastSeen
  useEffect(() => {
    if (!open) return;
    scrollToBottom();

    // เคลียร์ unread ณ ตอนเปิด
    unreadRef.current = 0;
    onUnreadChange?.(0);

    // ตั้ง lastSeen = เวลาล่าสุดของข้อความ (หรือ now)
    const latestTs =
      messages.length > 0
        ? new Date(messages[messages.length - 1].createdAt).getTime()
        : Date.now();
    lastSeenRef.current = latestTs;
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, String(latestTs));
    }
  }, [open, messages]); // เมื่อเปิดหรือข้อความอัปเดต

  // แสดงท้ายเมื่อมีข้อความใหม่ขณะแสดงป๊อปอัพ
  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  // typing indicator
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("typing", typing);
  }, [typing]);

  const send = () => {
    const s = socketRef.current;
    if (!s) return;
    const content = input.trim();
    if (!content) return;
    s.emit("message:send", { content }, (res: any) => {
      if (res?.ok) setInput("");
    });
  };

  if (!open) return null;

  return (
    <div className="fixed -inset-20 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[96vw] max-w-[45vw] h-[86vh] max-h-[880px] md:w-[90vw] md:h-[84vh] rounded-2xl overflow-hidden shadow-2xl bg-[#F9F7F7] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#112D4E] text-[#F9F7F7]">
          <div className="font-semibold truncate">Project Chat - {projectName}</div>
          <button
            onClick={() => {
              // ปิดแล้วถือว่าอ่านแล้ว: อัปเดต lastSeen (กันข้อความท้าย ๆ หลุด)
              const latestTs =
                messages.length > 0
                  ? new Date(messages[messages.length - 1].createdAt).getTime()
                  : Date.now();
              lastSeenRef.current = latestTs;
              if (typeof window !== "undefined") {
                localStorage.setItem(LS_KEY, String(latestTs));
              }
              unreadRef.current = 0;
              onUnreadChange?.(0);
              onOpenChange?.(false);
            }}
            className="p-1 rounded hover:bg-[#F9F7F7]/20"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {messages.map((m, idx) => {
            const isMe =
              typeof m.isMine === "boolean"
                ? m.isMine
                : currentUserId != null
                ? m.author?.id === currentUserId
                : false;

            const msgDate = dayjs(m.createdAt).startOf("day");
            const prevDate = idx > 0 ? dayjs(messages[idx - 1].createdAt).startOf("day") : null;
            const isNewDay = !prevDate || !msgDate.isSame(prevDate, "day");

            return (
              <div key={m._key} className="w-full flex flex-col">
                {isNewDay && (
                  <div className="flex justify-center my-2">
                    <span className="text-xs text-[#112D4E] bg-[#DBE2EF] px-3 py-1 rounded-full">
                      {msgDate.isSame(dayjs(), "day") ? "วันนี้" : msgDate.format("DD MMM YYYY")}
                    </span>
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                  <div
                    className={`max-w-[15vw] rounded-2xl px-3 py-2 shadow border border-[#DBE2EF] ${
                      isMe ? "bg-[#3F72AF] text-[#F9F7F7]" : "bg-[#DBE2EF] text-[#112D4E]"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                  <div className="text-[10px] text-[#112D4E]/70 mt-0.5">
                    {(m.author?.username ?? "user") + " · " + dayjs(m.createdAt).format("HH:mm")}
                  </div>
                </div>
              </div>
            );
          })}

          {typing ? (
            <div className="text-xs text-[#112D4E]/70 px-1 self-end text-right">กำลังพิมพ์...</div>
          ) : othersTyping ? (
            <div className="text-xs text-[#112D4E]/70 px-1 self-start text-left">กำลังพิมพ์...</div>
          ) : null}
        </div>

        <div className="border-t border-[#DBE2EF] bg-[#F9F7F7] p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setTyping(true)}
            onBlur={() => setTyping(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 rounded-xl border border-[#DBE2EF] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3F72AF] text-[#112D4E] placeholder-[#112D4E]/50 bg-white"
          />
          <button onClick={send} className="px-3 py-2 rounded-xl bg-[#3F72AF] text-[#F9F7F7] font-medium hover:opacity-90">
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}