"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { VscChevronLeft, VscChevronRight } from "react-icons/vsc";
import { MdSpaceDashboard } from "react-icons/md";
import { FaFolder, FaPlus } from "react-icons/fa";
import { useSidebarStore } from "@/hooks/sidebar";

interface Project {
  id: number;
  documentId?: string;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user_id: unknown;
  created_by_user: number;
  created_by_user_info?: unknown;
  slug: string;
}

interface Task {
  id: number;
  documentId?: string;
  task_name: string;
  description?: string;
  due_date: string;
  task_status: string;
  project_document_id: string;
  project_id_number: number;
  assigned_to_user_ids_number: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    project_name: string;
    documentId?: string;
  };
  assigned_to_user?: {
    id: number;
    username: string;
  };
}

interface SidebarApiResponse {
  hasAuth: boolean;
  projects: Project[];
  tasks: Task[];
}

export default function Sidebar() {
  const router = useRouter();
  const [myProjectOpen, setMyProjectOpen] = useState(true);
  const [myTaskOpen, setMyTaskOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { isNavOpen, toggleNav } = useSidebarStore();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<SidebarApiResponse>("/api/sidebar", {
          withCredentials: true,
        });
        setProjects(data.projects ?? []);
        setTasks(data.tasks ?? []);
        if (!data.hasAuth) {
          // ไม่มีสิทธิ์ -> ส่งไปหน้า login
          router.push("/auth_page/login");
        }
      } catch (e: any) {
        console.error("Failed to fetch sidebar data:", e);
        setErr(e?.response?.data?.message || "ไม่สามารถโหลดข้อมูลได้");
        if (e?.response?.status === 401) router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const dt = new Date(dateString);
    if (Number.isNaN(dt.getTime())) return "—";
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dt);
  };

  // เรียง task ตาม due_date ก่อน แล้วค่อยจัดกลุ่ม เพื่อลิสต์สวย ๆ
  const groupedTasks = useMemo(() => {
    const byProject: Record<
      string,
      { tasks: Task[]; projectInfo: Project | null }
    > = {};
    const sorted = [...tasks].sort((a, b) => {
      const ta = new Date(a.due_date).getTime();
      const tb = new Date(b.due_date).getTime();
      return (
        (Number.isNaN(ta) ? Infinity : ta) - (Number.isNaN(tb) ? Infinity : tb)
      );
    });

    for (const t of sorted) {
      // หา project ที่ตรงกับ task โดยเช็คจาก project_document_id หรือ project_id_number
      const matchedProject = projects.find(
        (p) =>
          (t.project_document_id &&
            (p.documentId === t.project_document_id ||
              p.id.toString() === t.project_document_id)) ||
          (t.project_id_number && p.id === t.project_id_number)
      );

      if (matchedProject) {
        const projectKey =
          matchedProject.documentId ?? matchedProject.id.toString();
        if (!byProject[projectKey]) {
          byProject[projectKey] = { tasks: [], projectInfo: matchedProject };
        }
        byProject[projectKey].tasks.push(t);
      } else {
        // ถ้าหา project ไม่เจอให้ใส่ในกลุ่ม no-project
        if (!byProject["no-project"]) {
          byProject["no-project"] = { tasks: [], projectInfo: null };
        }
        byProject["no-project"].tasks.push(t);
      }
    }
    return byProject;
  }, [tasks, projects]);

  const totalTasks = tasks.length;
  const totalProjects = projects.length;

  return (
    <aside className={`${isNavOpen ? 'transition-all duration-500 w-full md:w-64' : 'transition-all duration-500 md:w-18 '}  bg-white border border-gray-200 bottom-0 md:top-17 md:h-screen overflow-y-auto fixed`}>
      <div className="p-3 md:p-4">
        {/* Breadcrumb */}
        <div className="hidden md:flex flex-row md:mt-5 justify-between items-center space-x-2 text-sm text-gray-500 mb-6">
          <div className={`${isNavOpen ? 'flex' : 'hidden'} flex flex-row justify-center items-center gap-1`}>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5v6m8-6v6m-8-2h8"
              />
            </svg>
            <span>Home</span>
          </div>
          <button onClick={toggleNav} className="bg-white rounded-[16px]">
            <svg
            className={`flex md:flex w-4 h-4 transition-transform ${
              isNavOpen ? "rotate-180" : "rotate-0 ml-3"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          </button> 
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row justify-between md:grid md:grid-cols-1 md:gap-2 md:mb-6 px-5 md:p-0">
          <Link
            href="/main_pages/dashboard"
            className="md:bg-purple-100 md:text-purple-800 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium hover:bg-purple-200 transition-colors text-center flex items-center justify-start"
          >
            {isNavOpen ? (
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:ml-3">
              <MdSpaceDashboard className="w-4 h-4" />
              <div>Dashboard</div>
            </div>
            ) : (
              <div className="flex flex-row justify-center items-center">
              <MdSpaceDashboard className="w-4 h-4" />
            </div>
            )}
          </Link>
          <Link
            href="/main_pages/overview"
            className="md:bg-blue-100 md:text-blue-800 px-3 py-2 rounded-md text-xs md:text-sm font-medium hover:bg-blue-200 transition-colors text-center flex items-center justify-start"
          >
            {isNavOpen ? (
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:ml-3">
              <FaFolder className="w-5 h-4" />
              <div>overview</div>
            </div>
            ) : (
              <div className="flex flex-row justify-center items-center">
              <FaFolder className="w-4 h-4" />
            </div>
            )}
          </Link>
          <Link
            href="/main_pages/create-project"
            className="md:bg-green-100 md:text-green-800 px-3 py-2 rounded-md text-xs md:text-sm font-medium hover:bg-green-200 transition-colors text-center flex items-center justify-start"
          >
            {isNavOpen ? (
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:ml-3">
              <FaPlus className="w-4 h-4" />
              <div>Create</div>
            </div>
            ) : (
              <div className="flex flex-row justify-center items-center">
              <FaPlus className="w-4 h-4" />
            </div>
            )}
          </Link>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {err}
          </div>
        )}

        {/* My Projects */}
        <div className={`${isNavOpen ? 'hidden md:flex flex-col mb-6' : 'hidden'}`}>
          <button
            onClick={() => setMyProjectOpen((v) => !v)}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span>My Projects</span>
            <span className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-gray-100">
                {totalProjects}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  myProjectOpen ? "rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </button>

          {myProjectOpen && (
            <div className="space-y-2 ml-4">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 bg-gray-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : projects.length > 0 ? (
                projects.map((p) => {
                  const href = `/main_pages/projects/${p.documentId ?? p.id}`;
                  return (
                    <Link
                      key={p.documentId ?? p.id}
                      href={href}
                      className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                    >
                      📁 {p.project_name}
                    </Link>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">
                  ไม่มีโปรเจ็กต์ที่เป็นสมาชิก
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className={`${isNavOpen ? 'hidden md:flex flex-col' : 'hidden'} `}>
          <button
            onClick={() => setMyTaskOpen((v) => !v)}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span>My Tasks</span>
            <span className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-gray-100">
                {totalTasks}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  myTaskOpen ? "rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </button>

          {myTaskOpen && (
            <div className="space-y-4 ml-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg">
                      <div className="h-4 w-32 bg-gray-100 rounded mb-2 animate-pulse" />
                      <div className="space-y-2">
                        {[...Array(2)].map((__, j) => (
                          <div
                            key={j}
                            className="h-6 bg-gray-100 rounded animate-pulse"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(groupedTasks).length > 0 ? (
                Object.entries(groupedTasks).map(
                  ([projectKey, projectData]) => {
                    // ลิงก์โปรเจ็กต์: ใช้ documentId จาก projectInfo ถ้ามี
                    const projHref = projectData.projectInfo
                      ? `/main_pages/projects/${
                          projectData.projectInfo.documentId ??
                          projectData.projectInfo.id
                        }`
                      : undefined;
                    const projectName =
                      projectData.projectInfo?.project_name ?? "งานอื่นๆ";

                    return (
                      <div
                        key={projectKey}
                        className="bg-gray-50 p-2 rounded-lg"
                      >
                        {projectKey !== "no-project" && (
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2 text-blue-600 font-medium text-sm px-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                />
                              </svg>
                              {projHref ? (
                                <Link
                                  href={projHref}
                                  className="hover:underline"
                                >
                                  {projectName}
                                </Link>
                              ) : (
                                <span>{projectName}</span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500 mr-2">
                              ทั้งหมด {projectData.tasks.length} งาน
                            </span>
                          </div>
                        )}

                        <div className="space-y-0.5">
                          {projectData.tasks.map((task) => {
                            const projectKey =
                              projectData.projectInfo?.documentId ??
                              projectData.projectInfo?.id ??
                              task.project_document_id;
                            const taskKey = task.documentId ?? task.id;
                            const href = `/main_pages/projects/${projectKey}/tasks/${taskKey}`;
                            const isOverdue =
                              task.due_date &&
                              new Date(task.due_date).getTime() < Date.now() &&
                              task.task_status !== "done";

                            return (
                              <Link
                                key={task.id}
                                href={href}
                                className="block p-2 hover:bg-gray-100 rounded-md text-xs text-gray-700 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-lg text-gray-800 truncate">
                                    {task.task_name}
                                  </span>
                                  {task.task_status && (
                                    <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[10px] uppercase tracking-wide">
                                      {task.task_status}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`flex items-center gap-1 text-[11px] ${
                                    isOverdue
                                      ? "text-red-600 font-semibold"
                                      : "text-gray-500"
                                  }`}
                                >
                                  <span>
                                    กำหนดส่ง: {formatDate(task.due_date)}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="text-sm text-gray-500">
                  ไม่มีงานที่ได้รับมอบหมาย
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
