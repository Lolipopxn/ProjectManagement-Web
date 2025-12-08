"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useState, useRef } from "react";
import DraggableTask from "./draggableTask";
import TaskCard from "./TaskCard";

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export default function FreeDragBoard({ task, renderTaskCard}: any) {
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [position, setPosition] =  useState(() => {
        const pos: Record<string, { x: number; y: number }> = {};
        task.forEach((t: any, index: any) => {
            pos[t.id] = { x: 20, y: 20 + index * 80 };
        });
        return pos;
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const activeTask = task.find((t: any) => t.id === activeId);

    return (
        <DndContext
            onDragStart={({ active }) => {
                setActiveId(active.id as string);
            }}
            onDragEnd={({ active, delta }) => {
                const id = active.id;
                const container = containerRef.current;
                if (!container) return;

                const rect = container.getBoundingClientRect();

                const CARD_WIDTH = 200;
                const CARD_HEIGHT = 100;

                setPosition((prev: any) => {
                const newX = prev[id].x + delta.x;
                const newY = prev[id].y + delta.y;

                return {
                    ...prev,
                    [id]: {
                        x: clamp(newX, 0, rect.width - CARD_WIDTH),
                        y: clamp(newY, 0, rect.height - CARD_HEIGHT),
                    },
                };
                });

                setActiveId(null);
            }}
            onDragCancel={() => setActiveId(null)}
        >
            {/* Main board */}
            <div ref={containerRef} className="relative w-full h-[400px] overflow-y-hidden overflow-x-hidden border rounded-lg bg-gray-50">
                {task.map((t: any ) => (
                    <DraggableTask
                        key={t.id}
                        task={t}
                        position={position[t.id]}
                        isDragging={activeId === t.id}
                    >                 
                    </DraggableTask>
                ))}
                
            </div>
            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} overlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}