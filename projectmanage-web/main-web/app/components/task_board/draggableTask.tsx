"use client";

import { useDraggable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

import { AiOutlineCheckCircle, AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { RiProgress8Fill } from "react-icons/ri";
import ProgressAnimation from "../IconAnimation/ProgressAnimation";
import { getTaskStatusConfig } from "../../utils/taskStatusColors";
import { LuExpand } from "react-icons/lu";
import { JSX } from "react";

  const statusIcon: Record<string, JSX.Element> = {
    "not turn in": <AiOutlineCloseCircle className="text-red-400" />,
    "completed": <AiOutlineCheckCircle className="text-green-500" />,
    "turn in": <AiOutlineClockCircle className="text-yellow-500" />,
  };

  const getTimeLeft = (dueDate: string) => {
    const now = dayjs();
    const due = dayjs(dueDate);

    if (due.isBefore(now)) {
      return <div className="bg-red-100 py-1 px-2 rounded-full text-xs text-red-800">เลยกำหนด</div>;
    }

    const diff = dayjs.duration(due.diff(now));

    const days = diff.asDays();

    if (days >= 1) {
      return <div className="bg-green-100 py-1 px-2 rounded-full text-xs text-green-800">เหลือ {Math.floor(days)} วัน</div>;
    }

    const hours = diff.asHours();
    if (hours >= 1) {
      return <div className="bg-yellow-100 py-1 px-2 rounded-full text-xs text-yellow-800">เหลือ {Math.floor(hours)} ชั่วโมง</div>;
    }

    const minutes = diff.asMinutes();
    return <div className="bg-yellow-100 py-1 px-2 rounded-full text-xs text-yellow-800">เหลือ {Math.floor(minutes)} นาที</div>;
  };

// Left Draggable Task
export function LeftDraggable({ task, onClickTask}: any) {
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
      className="border-1 border-gray-500/50 shadow-md py-2 px-3 my-2 bg-white cursor-grab rounded-lg"
      onClick={(e) => {
        e.stopPropagation();
        onClickTask();
      }}
    >
      <div className="flex flex-col gap-4 select-none">

        <div className="flex flex-row justify-between items-center truncate">
          <div>{task.task_name}</div>
          <div>
            {/* <ProgressAnimation size={20} speed={300} /> */}
            {statusIcon[task.task_status]}
          </div>
        </div>
        <div className="flex flex-row justify-end text-sm">{getTimeLeft(task.due_date)}</div>
      </div>
      
    </div>
  );
}

// Right Draggable Task
export function RightDraggable({ task, position, onClickTask }: any) {
  const { setNodeRef, listeners, attributes, transform, isDragging  } = useDraggable({
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
      className={`reactive bg-white rounded shadow group
        ${isDragging ? "opacity-50" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onClickTask();
      }}
    >
      {/* Drag handle */}
      <LuExpand 
        {...listeners}
        {...attributes}
        className="hidden absolute top-3 right-3 size-3 cursor-grab active:cursor-grabbing select-none group-hover:flex focus:outline-none focus:ring-0"
        onClick={(e) => e.stopPropagation()}
      />

      <TaskCard task={task} />

    </div>
  );
}