"use client";

import { useDraggable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function DraggableTask ({ task, position }: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.id,
        data: { container: task.container },
    });

    const style: React.CSSProperties = {
        position: "absolute",
        top: position.y,
        left: position.x,
        transform: transform
            ? `translate(${transform.x}px, ${transform.y}px)`
            : "none",
        cursor: "grab",
        width: "fit-content",
    };

    return (
        <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
            <TaskCard task={task} />
        </div>
    );
}