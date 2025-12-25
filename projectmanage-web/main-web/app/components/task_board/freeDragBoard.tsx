"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { LeftDraggable, RightDraggable } from "./draggableTask";
import TaskCard from "./TaskCard";
import { LeftDroppable, RightDroppable } from "./DroppableBoard";
import { AddTaskPage, AddBoardPage, PopupDeleteBoard } from "./AddTaskInBoard";
import axios from "axios";

import dayjs from "dayjs";

import { FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import { set } from "date-fns";

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export default function FreeDragBoard({ tasks, project, projectId, SelectedTask, onOpenPopup }: any) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  const [boards, setBoards] = useState<string[]>(
    Array.isArray(project.boards) && project.boards.length > 0
      ? project.boards
      : ["สิ่งที่ต้องทำ"]
  );
  const [leftBoard, setLeftBoard] = useState(tasks);
  const [currentBoard, setCurrentBoard] = useState(project.currentBoard || "สิ่งที่ต้องทำ");
  const [rightBoard, setRightBoard] = useState<Record<
    string,
    Record<string, { x: number; y: number }>
  >>({
    "สิ่งที่ต้องทำ": {}
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = tasks.find((t: any) => t.id === activeId) ?? null;

  const [showAddTask, setAddTask] = useState(false);
  const [showAddBoard, setShowAddBoard] = useState(false);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    boardName: "",
  });

  const [confirmDelete, setConfirmDelete] = useState<{
    visible: boolean;
    boardName: string | null;
  }>({
    visible: false,
    boardName: null,
  });

  // ensure date exists
  if (!rightBoard[currentBoard]) {
    rightBoard[currentBoard] = {};
  }

  const handleRightClick = (e: React.MouseEvent, boardName: string) => {
    e.preventDefault();

    console.log("คลิกขวาที่บอร์ด:", boardName);

    setContextMenu(prev => ({
      visible:
        prev.boardName === boardName
          ? !prev.visible
          : true,
      boardName,
    }));
  };

  //delete board in project
  const handleDeleteBoard = async (boardName: string) => {
    const tasksInDeletedBoard = rightBoard[boardName]
      ? Object.keys(rightBoard[boardName])
      : [];

    setLeftBoard((prev: any) => {
      const returned = tasks.filter((t: any) =>
        tasksInDeletedBoard.includes(String(t.id))
      );

      const already = prev.map((t:any) => t.id);
      const merged = [...prev, ...returned.filter((t:any) => !already.includes(t.id))];

      return merged;
    });

    for (const id of tasksInDeletedBoard) {
      const t = tasks.find((task: any) => task.id == id);
      if (t) {
        await saveTaskPosition(
          t.documentId,
          "",
          0,
          0,
          true
        );
      }
    }

    setRightBoard(prev => {
      const copy = { ...prev };
      delete copy[boardName];
      return copy;
    });

    setBoards(prev => prev.filter(b => b !== boardName));

    if (currentBoard === boardName) {
      const newList = boards.filter(b => b !== boardName);
      if (newList.length > 0) {
        setCurrentBoard(newList[0]);
      }
    }

    setContextMenu({ visible: false, boardName: "" });
    setConfirmDelete({ visible: false, boardName: null });
  };

  const saveTaskPosition = async (
    documentId: string,
    boardName: string,
    x: number,
    y: number,
    isLeft: boolean
  ) => {
    try {
      await axios.put(`/api/tasks/updatePosition`, {
        documentId,
        board_name: boardName,
        pos_x: x,
        pos_y: y,
        is_left: isLeft,
      });

      console.log("ตำแหน่งถูกบันทึกแล้ว");
    } catch (error) {
      console.error("Error saving position", error);
    }
  };

  useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await axios.get('/api/auth/me');
          console.log('User authenticated:', response.data.user); // Debug log
          setCurrentUserId(response.data.user.id); // เก็บ user ID ของผู้สร้าง
          setIsCheckingAuth(false);
        } catch (error: any) {
          console.log('No authentication found, redirecting to login'); // Debug log
          router.push('/login');
        }
      };
      
      checkAuth();
    }, [router]);

  //Set position task in board
  useEffect(() => {
    const leftData: any[] = [];
    const rightData: Record<string, Record<string, { x: number; y: number }>> = {};

    tasks.forEach((task: any) => {
      if (
        !task.board_name || 
        task.is_left === true || 
        task.pos_x === undefined ||
        task.pos_y === undefined
      ) {
        leftData.push(task);
        return;
      }

      if (!rightData[task.board_name]) {
        rightData[task.board_name] = {};
      }

      rightData[task.board_name][task.id] = {
        x: task.pos_x,
        y: task.pos_y,
      };
    });

    setLeftBoard(leftData);
    setRightBoard(rightData);
  }, [tasks]);

  //save boards to db when boards change
  useEffect(() => {
    const updateBoardsToStrapi = setTimeout(async () => {
      try {
        const Payload: any = {
          documentId: projectId,
        };

        if (boards) Payload.boards = boards;
        if (currentBoard) Payload.currentBoard = currentBoard;

        if(!Payload.boards || !Payload.currentBoard) return;

        await axios.put("/api/projects/updateBoards", Payload);

        console.log("บันทึกบอร์ดสำเร็จ");
      } catch (err) {
        console.error("บันทึกบอร์ดล้มเหลว", err);
      }
    }, 500);

    return () => clearTimeout(updateBoardsToStrapi);
  },[boards, currentBoard]);

  useEffect(() => {
    const closeMenu = () => setContextMenu({ visible: false, boardName: "" });
    window.addEventListener("click", closeMenu);

    return () => window.removeEventListener("click", closeMenu);
  }, []);

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

          const boardPositions = rightBoard[currentBoard] || {};

          // Drop into right
          if (dropZone === "right") {
            const container = document.getElementById("right-drop-zone");
            if (!container) return;
            const rect = container.getBoundingClientRect();

            const CARD_W = 200;
            const CARD_H = 100;

            const newPos = {
              x: clamp((boardPositions[active.id]?.x ?? 20) + delta.x, 0, rect.width - CARD_W),
              y: clamp((boardPositions[active.id]?.y ?? 20) + delta.y, 0, rect.height - CARD_H),
            };

            setRightBoard((prev) => ({
              ...prev,
              [currentBoard]: {
                ...prev[currentBoard],
                [active.id]: newPos,
              },
            }));

            // remove from left if came from left
            if (from === "left") {
              setLeftBoard((prev: any) => prev.filter((t: any) => t.id !== active.id));
            }

            saveTaskPosition(activeTask.documentId, currentBoard, newPos.x, newPos.y, false);
          }

          if (dropZone === "left") {
            setRightBoard((prev) => {
              const newBoardData = { ...prev[currentBoard] };
              delete newBoardData[active.id];

              return {
                ...prev,
                [currentBoard]: newBoardData,
              };
            });

            const task = tasks.find((t: any) => t.id == active.id);
            setLeftBoard((prev: any) => {
              if (!prev.find((t: any) => t.id === task.id)) {
                return [...prev, task];
              }
              return prev;
            });

            saveTaskPosition(activeTask.documentId, currentBoard, 0, 0, true);
          }

          setActiveId(null);
        }}
      >
        {/* Left Board */}
        <LeftDroppable>
            <div className="w-full bg-[#F9F8F8] pb-10 rounded-lg p-3 space-y-4">
                <div className="flex flex-row justify-between items-center px-3">
                  <div className="flex flex-row gap-2">
                    <h2 className="font-semibold">รายการงาน</h2>
                    <div className="text-gray-500/90">( {leftBoard.length} )</div>
                  </div>
                  <div onClick={() => setAddTask(!showAddTask)} className="p-1 border-dashed hover:bg-gray-100">
                    <FaPlus  className="text-gray-500/90 size-4" />
                  </div>
                    
                </div>
                
                <div className="px-3 max-h-screen overflow-y-auto overflow-x-clip">
                    {leftBoard.map((task: any) => (
                        <LeftDraggable key={task.id} task={task} />
                    ))}
                </div>
            </div>
        </LeftDroppable>

        {/* Right Board */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex flex-row justify-start items-center space-x-3">        
            <div className="flex flex-row space-x-5 px-4 max-w-full">
              {boards.map((b) => (
                <div key={b} className="space-y-1 relative">
                  <button
                    onClick={() => setCurrentBoard(b)}
                    onContextMenu={(e) => handleRightClick(e, b)}
                    className={`p-2 hover:bg-gray-100 rounded-lg font-bold max-w-30 overflow-x-clip ${currentBoard === b ? "text-black" : "text-gray-500"}`}
                  >
                    {b}
                  </button>

                  {/* Right click show popup */}
                  {contextMenu.visible && contextMenu.boardName === b && (
                    <div className="absolute bg-white rounded shadow p-2 z-50 w-20">
                      <button
                        className="text-red-600 hover:text-red-800 flex flex-row justify-center items-center w-full space-x-2"
                        onClick={() => {
                          setConfirmDelete({ visible: true, boardName: b });
                          setContextMenu({ visible: false, boardName: "" });
                        }}
                      >
                        <FaTrash className="size-3" />
                        <span>ลบ</span>
                        
                      </button>
                    </div>
                  )}

                  {/* Bottom line  */}
                  <div className={`${currentBoard === b ? "border-b-3 border-[#6E8CFB]" : ""}`}></div>
                </div>
              ))}
            </div>

            <div onClick={() => setShowAddBoard(!showAddBoard)} className="p-1 bg-white hover:bg-gray-100">
              <FaPlus className="text-gray-600 size-4 mb-1" />
            </div>
          </div>

          <div id="right-drop-zone">
            <RightDroppable>
              {Object.keys(rightBoard[currentBoard]).map((id) => {
                const task = tasks.find((t: any) => t.id == id);
                return (
                  <RightDraggable
                    key={id}
                    task={task}
                    position={rightBoard[currentBoard][id]}
                    onClickTask={() => SelectedTask(task)}
                    onOpenPopup={onOpenPopup}
                  />
                );
              })}
            </RightDroppable>
          </div>
        </div>

        {showAddTask && (
            <AddTaskPage user={currentUserId} project={project} projectId={projectId} onClose={() => setAddTask(false)}/>
        )}
        {showAddBoard && (
          <AddBoardPage 
            boards={boards}
            setBoards={setBoards}
            rightBoard={rightBoard}
            setRightBoard={setRightBoard}
            onClose={() => setShowAddBoard(false)}
          />
        )}
        {confirmDelete.visible && (
          <PopupDeleteBoard
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            onDelete={() => handleDeleteBoard(confirmDelete.boardName as string)}
          />
        )}       

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}