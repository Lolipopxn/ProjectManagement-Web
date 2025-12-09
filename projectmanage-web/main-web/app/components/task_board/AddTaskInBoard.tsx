"use client";

import { useState } from "react";
import dayjs from "dayjs";


export default function addTaskPage() {

    const [newTask, setNewTask] = useState({
        task_name: "",
        description: "",
        due_date: dayjs().format("YYYY-MM-DD"),
    });
    const handleCreateTask = {

    };

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-md w-80 shadow">
            <h3 className="font-semibold mb-3">เพิ่ม Task ใหม่</h3>

            <input
                className="border rounded w-full p-2 mb-3"
                placeholder="ชื่อ Task"
                value={newTask.task_name}
                onChange={(e) =>
                setNewTask({ ...newTask, task_name: e.target.value })
                }
            />

            <textarea
                className="border rounded w-full p-2 mb-3"
                placeholder="รายละเอียด"
                value={newTask.description}
                onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
                }
            />

            <input
                type="date"
                className="border rounded w-full p-2 mb-3"
                value={newTask.due_date}
                onChange={(e) =>
                setNewTask({ ...newTask, due_date: e.target.value })
                }
            />

            <div className="flex justify-end gap-2">
                <button
                
                className="px-3 py-1 bg-gray-200 rounded"
                >
                ยกเลิก
                </button>

                <button
                className="px-3 py-1 bg-[#6E8CFB] text-white rounded"
                >
                บันทึก
                </button>
            </div>
            </div>
        </div>
    );
}