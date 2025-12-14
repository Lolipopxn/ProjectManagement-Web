"use client";

import { useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

interface Project {
  id: number;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user: number;
  slug: string;
}

interface TaskForm {
  taskName: string;
  description: string;
  dueDate: string;
  dueTime: string;
  assignedUserId: number | null;
}

//Add Task UI to Left Board
export function AddTaskPage({ user, project, projectId, onClose }: {user:number | null , project: Project, projectId: string, onClose: () => void}) {
  const [form, setForm] = useState<TaskForm>({
    taskName: "",
    description: "",
    dueDate: dayjs().format("YYYY-MM-DD"),
    dueTime: "",
    assignedUserId: null,
  });

  const [loading, setLoading] = useState(false);

  const handleCreateTask = async () => {
    try {
        setLoading(true);

        let combinedDueDate = form.dueDate;
        if (form.dueTime) {
        combinedDueDate = `${form.dueDate}T${form.dueTime}:00.000Z`;
        }

        const response = await axios.post("/api/tasks/create", {
        task_name: form.taskName,
        description: form.description,
        due_date: combinedDueDate,
        project_document_id: projectId,
        project_id_number: project?.id,
        assigned_to_user_ids_number: user,
        task_status: "not turn in"
        });

        if (response.data.success) {
        alert("Task created!");
        } else {
        alert("Error: " + response.data.message);
        }

    } catch (error: any) {
        console.log("Error creating task:", error.response?.data || error);
        alert(error.response?.data?.message || "Create task failed");
    } finally {
        setLoading(false);
        onClose();
    }
    };

  return (
    <div className="fixed inset-0 bg-black/40 z-99 flex justify-center items-center">
      <div className="bg-white rounded-md w-100 py-8 px-6 flex flex-col space-y-4 shadow">
        <h3 className="font-semibold mb-3">เพิ่ม Task ใหม่</h3>

        {/* TASK NAME */}
        <input
          className="border border-gray-400 shadow rounded w-full p-2"
          placeholder="ชื่อ Task"
          value={form.taskName}
          onChange={(e) =>
            setForm({ ...form, taskName: e.target.value })
          }
        />

        {/* DESCRIPTION */}
        <textarea
          className="border border-gray-400 shadow rounded w-full p-2"
          placeholder="รายละเอียด"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        {/* DUE DATE */}
        <input
          type="date"
          className="border border-gray-400 shadow rounded w-full p-2"
          value={form.dueDate}
          onChange={(e) =>
            setForm({ ...form, dueDate: e.target.value })
          }
        />

        {/* DUE TIME */}
        <input
          type="time"
          className="border border-gray-400 shadow rounded w-full p-2 "
          value={form.dueTime}
          onChange={(e) =>
            setForm({ ...form, dueTime: e.target.value })
          }
        />

        {/* BUTTONS */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-red-400 hover:text-white">
            ยกเลิก
          </button>

          <button
            disabled={loading}
            onClick={handleCreateTask}
            className="px-3 py-1 bg-[#6E8CFB] hover:bg-[#6E8CFB]/80 text-white rounded"
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

//Add Board UI to Right Board
export function AddBoardPage({ boards, setBoards, rightBoard, setRightBoard, onClose }: any) {
  const [name, setName] = useState("");

  const handleAddBoard = () => {
    if (!name.trim()) return;

    if (!boards.includes(name)) {
      setBoards((prev: any) => [...prev, name]);
      setRightBoard((prev: any) => ({
        ...prev,
        [name]: {} 
      }));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-99 flex justify-center items-center">
      <div className="bg-white p-6 rounded-md w-150 h-auto shadow relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-7 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <h3 className="font-semibold mb-5 mt-5">สร้างบอร์ดใหม่</h3>

        <div className="flex flex-col justify-start h-full space-y-5">
          <input
            className="border rounded w-full p-2"
            placeholder="ชื่อบอร์ด เช่น ออกเเบบ, พัฒนา, ทดสอบ, ฯลฯ"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex flex-row justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-red-400 hover:text-white">
              ยกเลิก
            </button>

            <button
              onClick={handleAddBoard}
              className="px-3 py-1 bg-[#6E8CFB] hover:bg-[#6E8CFB]/80 text-white rounded"
            >
              สร้าง
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export function PopupDeleteBoard ( {confirmDelete, setConfirmDelete, onDelete}: 
  {
    confirmDelete:{ visible: boolean; boardName: string | null },
    setConfirmDelete: any,
    onDelete: () => void
  }
  ) {

  return ( 
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 ">
      <div className="bg-white p-6 flex flex-col rounded-lg shadow-lg w-80 space-y-4">
        <h3 className="font-semibold text-lg ">ยืนยันการลบ</h3>
        <p className="text-gray-700">
          ต้องการลบกระดาน "<b>{confirmDelete.boardName}</b>" หรือไม่?
        </p>

        <div className="flex justify-end gap-3">
          <button
            className="px-3 py-1 rounded hover:bg-gray-100 "
            onClick={() => setConfirmDelete({ visible: false, boardName: null })}
          >
            ยกเลิก
          </button>

          <button
            className="px-6 py-1 rounded bg-red-500 hover:bg-red-500/80 text-white"
            onClick={onDelete}
          >
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
}