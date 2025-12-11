"use client";

import { JSX } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/th";

import { getTaskStatusConfig } from "../../utils/taskStatusColors";

import { IoPersonCircle } from "react-icons/io5";
import { AiOutlineCheckCircle, AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { RiProgress8Fill } from "react-icons/ri";

dayjs.locale("th");
dayjs.extend(duration);

export default function TaskCard({ task, overlay = false }: any) {
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

    const statusIcon: Record<string, JSX.Element> = {
      "not turn in": <AiOutlineCloseCircle className="text-red-400 size-4" />,
      "completed": <RiProgress8Fill className="text-green-500 size-4" />,
      "turn in": <AiOutlineClockCircle className="text-yellow-500 size-4" />,
    };

    const statusColor: Record<string, string> = {
      "not turn in": "text-red-600",
      "completed": "text-green-600",
      "turn in": "text-yellow-600",
    };

  return (
    <div
      className={`flex flex-col space-y-3 p-4 shadow-md border border-gray-200 bg-white min-w-[150px] max-w-[250px]
        ${overlay ? "shadow-xl scale-105" : ""}`}
    >
      
      {/*Task Name*/}
      <div className="flex items-center">
        <div className="flex-grow border border-gray-300"></div>
        <span className="px-2 bg-white text-gray-700 font-semibold max-w-[200px]">{task.task_name}</span>
        <div className="flex-grow border border-gray-300"></div>
      </div>

      {/*Task day left*/}
      <span className="text-center">
        {getTimeLeft(task.due_date)}
      </span>

      {/*Task Description*/}
      <div className="px-2">
        <span className="text-sm text-gray-600">{task.description}</span>
      </div>

      {/*Task day end*/}
      <span className="text-xs px-2 text-gray-500">
        {dayjs(task.createdAt).format("D MMM YYYY")} - 
        {dayjs(task.due_date).format("D MMM YYYY")}
      </span>

      {/*task status*/}
      <span className={`flex flex-row justify-between items-center px-2 text-xs  mt-2 ${getTaskStatusConfig(task.task_status)}`}>
        <div className={`${statusColor[task.task_status]}`}>{getTaskStatusConfig(task.task_status).text}</div>
        <div>{statusIcon[task.task_status]}</div>
      </span>

      {/*Task assign to user*/}
      <div className="text-xs px-1 text-gray-500 flex flex-row justify-start gap-2 items-center">
        <IoPersonCircle className="size-4"/>
        <span>{task.assigned_to_user_ids?.length ? `${task.assigned_to_user_ids.map((u: any ) => u.username).join(", ")}` : "ไม่มอบหมายงาน"}</span>
      </div>

    </div>
  );
}