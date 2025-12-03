'use client'

import GanttChart from "../components/GanttChart";

import { useEffect, useState } from "react";
import axios from "axios";

interface Task {
  id: number;
  documentId?: string;
  task_name: string;
  description: string;
  task_status: Date;
  due_date: Date;
  created_at: string;
  project_document_id: string;
  assigned_to_user_ids_number: number;
  assigned_to_user_ids?: any;
  project_id?: any;
  attributes?: any;
}

export default function GanttPage() {
  //const [tasks, setTasks] = useState<Task[]>([]);

  const tasks = [
  {
    title: "Market Research",
    startMonth: new Date("2025-01-01"),
    endMonth: new Date("2025-02-28"),
    color: "bg-blue-200",
  },
  {
    title: "Brand Strategy",
    startMonth: new Date("2025-01-01"),
    endMonth: new Date("2025-02-28"),
    color: "bg-purple-200",
  },
  {
    title: "Content Creation",
    startMonth: new Date("2025-01-01"),
    endMonth: new Date("2025-02-28"),
    color: "bg-green-200",
  },
  {
    title: "Digital Advertising",
    startMonth: new Date("2025-01-01"),
    endMonth: new Date("2025-02-28"),
    color: "bg-amber-200",
  },
  {
    title: "Sales Training",
    startMonth: new Date("2025-01-01"),
    endMonth: new Date("2025-02-28"),
    color: "bg-red-200",
  },
  {
    title: "Product Launch",
    startMonth: new Date("2025-01-01"),
    endMonth: new Date("2025-02-28"),
    color: "bg-blue-200",
  },
  {
    title: "Lead Generation",
    startMonth: new Date("2025-01-01"),
    endMonth: new Date("2025-02-28"),
    color: "bg-teal-200",
  }
];
  // useEffect(() => {
  //   axios.get("http://localhost:1337/api/tasks")
  //     .then(res => setTasks(res.data.data.map((t: any) => ({
  //       id: t.id,
  //       ...t,
  //     }))))
  //     .catch(err => console.error(err));
  // }, []);

  return (
    <div className="p-6">
      <h1 className="font-semibold text-2xl mb-4">Gantt Chart</h1>
      {/* <GanttChart/> */}
    </div>
  );
}