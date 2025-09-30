"use client";

import { useVoiceRoom } from "../../contexts/VoiceRoomContext";
import type { ReactNode } from "react";
import { Mic } from "lucide-react";

interface VoiceRoomButtonProps {
  slug: string;
  children?: ReactNode;
  className?: string;
}

export default function VoiceRoomButton({
  slug,
  children,
  className = "",
}: VoiceRoomButtonProps) {
  const { openVoiceRoom } = useVoiceRoom();
  return (
    <button
      type="button"
      onClick={() => openVoiceRoom(slug)}
      className={`inline-flex items-center text-sm gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${className}`}
    >
      <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{children || "เปิด Voice Room"}</span>
    </button>
  );
}