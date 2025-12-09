"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useState } from "react";
import { LeftDraggable, RightDraggable } from "./draggableTask";
import TaskCard from "./TaskCard";
import { LeftDroppable, RightDroppable } from "./DroppableBoard";
import addTaskPage from "./AddTaskInBoard";

import dayjs from "dayjs";

import { FaPlus } from "react-icons/fa";

interface Task {
  id: number;
  documentId?: string;
  task_name: string;
  description: string;
  task_status: string;
  due_date: string;
  createdAt: string;
  project_document_id: string;
  assigned_to_user_ids_number: number;
  assigned_to_user_ids?: any;
  project_id?: any;
  attributes?: any;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export default function FreeDragBoard({ tasks }: any) {
  const [currentDate, setCurrentDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [leftBoard, setLeftBoard] = useState(tasks);
  const [rightBoard, setRightBoard] = useState<Record<
    string,
    Record<string, { x: number; y: number }>
  >>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = tasks.find((t: any) => t.id === activeId) ?? null;

  const [showAddTask, setAddTask] = useState(false);
  const [newTask, setNewTask] = useState<Task>();

  // ensure date exists
  if (!rightBoard[currentDate]) {
    rightBoard[currentDate] = {};
  }

  return (
    <div className="flex gap-4">
      <DndContext
        onDragStart={({ active }) => {
          setActiveId(active.id as string);
        }}
        onDragEnd={({ active, over, delta }) => {
          if (!over) return;

          const from = active.data.current?.from;
          const dropZone = over.id;

          const dayPositions = rightBoard[currentDate] || {};

          // Drop into right
          if (dropZone === "right") {
            const container = document.getElementById("right-drop-zone");
            if (!container) return;
            const rect = container.getBoundingClientRect();

            const CARD_W = 200;
            const CARD_H = 100;

            const newPos = {
              x: clamp((dayPositions[active.id]?.x ?? 20) + delta.x, 0, rect.width - CARD_W),
              y: clamp((dayPositions[active.id]?.y ?? 20) + delta.y, 0, rect.height - CARD_H),
            };

            setRightBoard((prev) => ({
              ...prev,
              [currentDate]: {
                ...prev[currentDate],
                [active.id]: newPos,
              },
            }));

            // remove from left if came from left
            if (from === "left") {
              setLeftBoard((prev: any) => prev.filter((t: any) => t.id !== active.id));
            }
          }

          // Drop into left
          if (over.id === "left") {
            // remove from right
            setRightBoard((prev) => {
                const newDay = { ...prev[currentDate] };
                delete newDay[active.id];

                return {
                ...prev,
                [currentDate]: newDay,
                };
            });

            // add back to left board
            const task = tasks.find((t: any) => t.id == active.id);
            setLeftBoard((prev: any) => {
                if (!prev.find((t: any) => t.id === task.id)) {
                return [...prev, task];
                }
                return prev;
            });
         }

          setActiveId(null);
        }}
      >
        {/* Left Board */}
        <LeftDroppable>
            <div className="w-full border bg-white rounded-md p-4">
                <div className="flex flex-row justify-between items-center">
                    <h2 className="font-semibold">Task List</h2>
                    <div onClick={() => setAddTask(!showAddTask)} className="p-1 bg-white border-dashed hover:bg-gray-100">
                        <FaPlus  className="text-[#6E8CFB] size-4" />
                    </div>
                    
                </div>
                
                <div className="p-2 h-100 overflow-y-auto overflow-x-clip">
                    {leftBoard.map((task: any) => (
                        <LeftDraggable key={task.id} task={task} />
                    ))}
                </div>
            </div>
        </LeftDroppable>

        {/* Right Board */}
        <div className="w-full">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="border mb-3 p-1 rounded"
          />

          <div id="right-drop-zone">
            <RightDroppable>
              {Object.keys(rightBoard[currentDate]).map((id) => {
                const task = tasks.find((t: any) => t.id == id);
                return (
                  <RightDraggable
                    key={id}
                    task={task}
                    position={rightBoard[currentDate][id]}
                  />
                );
              })}
            </RightDroppable>
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}