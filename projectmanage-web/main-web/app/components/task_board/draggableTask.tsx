"use client";

import { useDraggable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

// Left Draggable Task
export function LeftDraggable({ task }: any) {
  const { setNodeRef, listeners, attributes, transform } = useDraggable({
    id: task.id,
    data: { from: "left" },
  });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="border p-2 my-2 bg-gray-100 cursor-grab rounded"
    >
      {task.task_name}
    </div>
  );
}

// Right Draggable Task
export function RightDraggable({ task, position }: any) {
  const { setNodeRef, listeners, attributes, transform } = useDraggable({
    id: task.id,
    data: { from: "right" },
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: position.x,
    top: position.y,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab"
    >
      <TaskCard task={task} />
    </div>
  );
}