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
};

export default function ProjectChatPopup({
  projectSlug,
  projectName,
  getToken,
  open,
  onOpenChange,
  currentUserId,
}: ProjectChatPopupProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [othersTyping, setOthersTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const makeKey = (m: any) =>
    m.id != null
      ? `id-${m.id}`
      : m._key ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // helper: scroll to bottom
  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    // ใช้ rAF ให้ทำหลัง DOM วาดเสร็จ จะนิ่มกว่า
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  // create socket only when popup opens
  useEffect(() => {
    if (!open) return;
    const token = getToken;
    if (!token) return;

    fetch("/api/socket"); // init server

    const s = io({
      path: "/api/socket_io",
      auth: { token, projectSlug },
    });
    socketRef.current = s;

    s.on("message:new", (m: any) => {
      const withKey = { ...m, _key: makeKey(m) };
      setMessages((prev) => {
        const map = new Map(prev.map((x) => [x.id ?? x._key, x]));
        map.set(withKey.id ?? withKey._key, withKey);
        return Array.from(map.values());
      });
    });

    s.on("typing", (t: { userId: number; state: boolean }) => {
      setOthersTyping(t.state);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [open, projectSlug, getToken]);

  // initial fetch when opened
  useEffect(() => {
    (async () => {
      if (!open) return;
      const token = getToken;
      if (!token) return;
      const initial = await fetchMessages(token, projectSlug, 50);
      setMessages(initial.map((m: any) => ({ ...m, _key: makeKey(m) })));
    })();
  }, [open, projectSlug, getToken]);

  // always show the latest at bottom when messages change
  useEffect(() => {
    if (!open) return;
    scrollToBottom();
  }, [messages, open]);

  // typing indicator
  useEffect(() => {
    if (!open || !socketRef.current) return;
    socketRef.current.emit("typing", typing);
  }, [typing, open]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[96vw] max-w-[600px] h-[86vh] max-h-[880px] md:w-[90vw] md:h-[84vh] rounded-2xl overflow-hidden shadow-2xl bg-white flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#2E5077] text-white">
          <div className="font-semibold truncate">Project Chat - {projectName}</div>
          <button
            onClick={() => onOpenChange?.(false)}
            className="p-1 rounded hover:bg-white/20"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-3 flex flex-col gap-2"
        >
          {messages.map((m) => {
            const isMe =
              typeof m.isMine === "boolean"
                ? m.isMine
                : currentUserId != null
                ? m.author?.id === currentUserId
                : false;

            return (
              <div
                key={m._key}
                className={`flex flex-col ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 shadow border border-black/5 ${
                    isMe
                      ? "bg-[#79D7BE] text-[#2E5077]"
                      : "bg-white text-gray-800"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {m.content}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {(m.author?.username ?? "user") + " · " + dayjs(m.createdAt).format("HH:mm")}
                </div>
              </div>
            );
          })}
          {othersTyping && (
            <div className="text-xs text-gray-500 px-1">กำลังพิมพ์...</div>
          )}
        </div>

        <div className="border-t border-black/10 bg-white p-2 flex items-center gap-2">
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
            className="flex-1 rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#79D7BE]"
          />
          <button
            onClick={send}
            className="px-3 py-2 rounded-xl bg-[#2E5077] text-[#ffffff] font-medium hover:opacity-90"
          >
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}
