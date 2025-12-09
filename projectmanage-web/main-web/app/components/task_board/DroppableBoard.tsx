"use client";

import { useDroppable } from "@dnd-kit/core";

// Left Droppable Area
export function LeftDroppable({ children }: any) {
  const { setNodeRef } = useDroppable({ id: "left" });

  return (
    <div ref={setNodeRef} className="w-1/5">
      {children}
    </div>
  );
}

// Right Droppable Area
export function RightDroppable({ children }: any) {
  const { setNodeRef } = useDroppable({ id: "right" });

  return (
    <div
      ref={setNodeRef}
      className="relative w-full h-[400px] bg-gray-100 rounded border overflow-hidden"
    >
      {children}
    </div>
  );
}