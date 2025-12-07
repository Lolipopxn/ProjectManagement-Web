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
      className={`inline-flex items-center text-sm gap-2 whitespace-nowrap rounded-sm bg-white px-4 py-1.5 text-black hover:text-white focus:text-white transition-colors hover:bg-[#636CCB] focus:outline-none focus:bg-[#636CCB] focus:ring-offset-2 ${className}`}
    >
      <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{children || "เปิด Voice Room"}</span>
    </button>
  );
}