"use client";

import { useDroppable } from "@dnd-kit/core";
import { useState, useCallback, useEffect } from "react";

// Left Droppable Area
export function LeftDroppable({ children }: any) {
  const { setNodeRef } = useDroppable({ id: "left" });

  return (
    <div ref={setNodeRef} className="w-full md:w-1/4 ">
      {children}
    </div>
  );
}

// Right Droppable Area
export function RightDroppable({ children }: any) {
  const { setNodeRef } = useDroppable({ id: "right" });

  const [height, setHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(400);

  const SCROLL_THRESHOLD = 80;
  const SCROLL_SPEED = 100;

  const onMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // --- change hight ---
      const diff = e.clientY - startY;
      setHeight(Math.max(0, startHeight + diff));

      // --- Auto Scroll down---
      const viewportBottom = window.innerHeight;
      const mouseY = e.clientY;

      if (mouseY > viewportBottom - SCROLL_THRESHOLD) {
        window.scrollBy({ top: SCROLL_SPEED, behavior: "smooth" });
      }

    },
    [isResizing, startY, startHeight]
  );

  const stopResize = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", stopResize);
    } else {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopResize);
    }

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopResize);
    };
  }, [isResizing, onMouseMove]);


  return (
    <div className=" relative w-full">
      <div
        ref={setNodeRef}
        style={{ height }}
        className="relative w-full bg-gray-50 rounded border border-gray-400/80 overflow-x-auto"
      >
        {children}

        
      </div>
      {/* resize */}
        <div
          onMouseDown={onMouseDown}
          className="
             bottom-0 left-0 w-full h-4 
            cursor-row-resize bg-gray-300/50 hover:bg-gray-400/70
          "
        ></div>
    </div>
  );
}
