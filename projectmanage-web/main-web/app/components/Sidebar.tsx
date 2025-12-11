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
  
  // Pagination state for My Tasks
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 4; // จำนวน tasks ต่อหน้า
  
  // Pagination state for My Projects
  const [projectCurrentPage, setProjectCurrentPage] = useState(1);
  const PROJECTS_PER_PAGE = 4; // จำนวน projects ต่อหน้า

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

  // Pagination logic for tasks - แบ่งตาม individual tasks ไม่ใช่ project groups
  const allTasks = useMemo(() => {
    const taskList: Array<{ task: Task; projectInfo: Project | null }> = [];
    Object.values(groupedTasks).forEach(group => {
      group.tasks.forEach(task => {
        taskList.push({ task, projectInfo: group.projectInfo });
      });
    });
    return taskList;
  }, [groupedTasks]);

  const totalPages = Math.ceil(allTasks.length / TASKS_PER_PAGE);
  const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
  const endIndex = startIndex + TASKS_PER_PAGE;
  const paginatedTaskList = allTasks.slice(startIndex, endIndex);

  // Pagination logic for projects
  const projectTotalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);
  const projectStartIndex = (projectCurrentPage - 1) * PROJECTS_PER_PAGE;
  const projectEndIndex = projectStartIndex + PROJECTS_PER_PAGE;
  const paginatedProjects = projects.slice(projectStartIndex, projectEndIndex);

  // Reset to page 1 when tasks change
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length]);

  // Reset to page 1 when projects change
  useEffect(() => {
    setProjectCurrentPage(1);
  }, [projects.length]);

  return (
    <aside className={`${isNavOpen ? 'transition-all duration-500 w-full md:w-64' : 'transition-all duration-500 md:w-18 '}  bg-white border border-gray-200 bottom-0 md:top-13 md:h-screen overflow-y-auto fixed scrollbar-autohide`}>
      <div className="p-3 md:px-4 md:py-3">
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
        <div className={`${isNavOpen ? 'hidden md:flex flex-col mb-2' : 'hidden'}`}>
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
            <div className="ml-4 relative">
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
              ) : projects.length > 0 ? (
                <div className="flex flex-col">
                  <div className="space-y-1 h-[320px]">
                      {paginatedProjects.map((p) => {
                        const href = `/main_pages/projects/${p.documentId ?? p.id}`;
                        return (
                          <div key={p.documentId ?? p.id} className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-h-[76px]">
                            <Link href={href} className="block p-2.5 h-full flex flex-col justify-between">
                              {/* Project Name & Status */}
                              <div className="flex items-start gap-2 mb-1.5">
                                <span className="font-semibold text-sm text-gray-800 flex-1 line-clamp-1">
                                  {p.project_name}
                                </span>
                                {p.project_status && (
                                  <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[10px] uppercase tracking-wide flex-shrink-0">
                                    {p.project_status}
                                  </span>
                                )}
                              </div>

                              {/* Date Range */}
                              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDate(p.start_date)} - {formatDate(p.end_date)}</span>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                  </div>

                  {/* Pagination Controls for Projects */}
                  {projectTotalPages > 1 && (
                    <div className="flex flex-col gap-2 mt-4">
                      {/* Navigation Buttons */}
                      <div className="flex items-center justify-center gap-1.5">
                        {/* First Page Button */}
                        <button
                          onClick={() => setProjectCurrentPage(1)}
                          disabled={projectCurrentPage === 1}
                          className={`p-1 rounded transition-all duration-200 ${
                            projectCurrentPage === 1
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95'
                          }`}
                          title="หน้าแรก"
                          aria-label="ไปหน้าแรก"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Previous Button */}
                        <button
                          onClick={() => setProjectCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={projectCurrentPage === 1}
                          className={`p-1 rounded transition-all duration-200 ${
                            projectCurrentPage === 1
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95'
                          }`}
                          title="ก่อนหน้า"
                          aria-label="หน้าก่อนหน้า"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Page Display */}
                        <div className="flex items-center gap-1 px-2">
                          <span className="text-xs font-bold text-blue-600">{projectCurrentPage}</span>
                          <span className="text-xs text-gray-400">/</span>
                          <span className="text-xs font-medium text-gray-500">{projectTotalPages}</span>
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => setProjectCurrentPage(prev => Math.min(projectTotalPages, prev + 1))}
                          disabled={projectCurrentPage === projectTotalPages}
                          className={`p-1 rounded transition-all duration-200 ${
                            projectCurrentPage === projectTotalPages
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95'
                          }`}
                          title="ถัดไป"
                          aria-label="หน้าถัดไป"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Last Page Button */}
                        <button
                          onClick={() => setProjectCurrentPage(projectTotalPages)}
                          disabled={projectCurrentPage === projectTotalPages}
                          className={`p-1 rounded transition-all duration-200 ${
                            projectCurrentPage === projectTotalPages
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95'
                          }`}
                          title="หน้าสุดท้าย"
                          aria-label="ไปหน้าสุดท้าย"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Page Dots Indicator */}
                      <div className="flex items-center justify-center gap-1">
                        {(() => {
                          const renderPageDot = (page: number) => (
                            <button
                              key={page}
                              onClick={() => setProjectCurrentPage(page)}
                              className={`transition-all duration-200 ${
                                projectCurrentPage === page
                                  ? 'w-6 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700'
                                  : 'w-1.5 h-1.5 rounded-full bg-gray-300 hover:bg-blue-400 hover:w-3'
                              }`}
                              title={`หน้า ${page}`}
                              aria-label={`ไปหน้า ${page}`}
                              aria-current={projectCurrentPage === page ? 'page' : undefined}
                            />
                          );

                          // Show all dots if projectTotalPages <= 10
                          if (projectTotalPages <= 10) {
                            return Array.from({ length: projectTotalPages }, (_, i) => i + 1).map(renderPageDot);
                          }

                          // For many pages, show smart dots
                          const dots: number[] = [];
                          
                          if (projectCurrentPage <= 5) {
                            // Near start
                            for (let i = 1; i <= Math.min(7, projectTotalPages); i++) dots.push(i);
                          } else if (projectCurrentPage >= projectTotalPages - 4) {
                            // Near end
                            for (let i = Math.max(1, projectTotalPages - 6); i <= projectTotalPages; i++) dots.push(i);
                          } else {
                            // Middle
                            for (let i = projectCurrentPage - 3; i <= projectCurrentPage + 3; i++) {
                              if (i >= 1 && i <= projectTotalPages) dots.push(i);
                            }
                          }

                          return dots.map(renderPageDot);
                        })()}
                      </div>
                    </div>
                  )}
                </div>
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
            <div className="ml-4 relative">
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
              ) : allTasks.length > 0 ? (
                <div className="flex flex-col">
                <div className="space-y-1 h-[320px]">
                {paginatedTaskList.map(({ task, projectInfo }, index) => {
                  const projectKey =
                    projectInfo?.documentId ??
                    projectInfo?.id ??
                    task.project_document_id;
                  const taskKey = task.documentId ?? task.id;
                  const href = `/main_pages/projects/${projectKey}/tasks/${taskKey}`;
                  const isOverdue =
                    task.due_date &&
                    new Date(task.due_date).getTime() < Date.now() &&
                    task.task_status !== "done";
                  const projectName = projectInfo?.project_name ?? "งานอื่นๆ";

                  return (
                    <div key={`${task.id}-${index}`} className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-h-[76px]">
                      <Link
                        href={href}
                        className="block p-2.5 h-full flex flex-col justify-between"
                      >
                        {/* Task Name & Status */}
                        <div className="flex items-start gap-2 mb-1.5">
                          <span className="font-semibold text-sm text-gray-800 flex-1 line-clamp-1">
                            {task.task_name}
                          </span>
                          {task.task_status && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[10px] uppercase tracking-wide flex-shrink-0">
                              {task.task_status}
                            </span>
                          )}
                        </div>

                        {/* Project Name */}
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-600 mb-1">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                            />
                          </svg>
                          <span className="truncate">{projectName}</span>
                        </div>

                        {/* Due Date */}
                        <div
                          className={`flex items-center gap-1 text-[11px] ${
                            isOverdue
                              ? "text-red-600 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>กำหนดส่ง: {formatDate(task.due_date)}</span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
                </div>
                
                {/* Pagination Controls - Enhanced UX/UI */}
                {totalPages > 1 && (
                  <div className="flex flex-col gap-2 mt-10 pb-15">
                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-center gap-1.5">
                      {/* First Page Button */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`p-1 rounded transition-all duration-200 ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed opacity-50'
                            : 'text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95'
                        }`}
                        title="หน้าแรก"
                        aria-label="ไปหน้าแรก"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`p-1 rounded transition-all duration-200 ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed opacity-50'
                            : 'text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95'
                        }`}
                        title="ก่อนหน้า"
                        aria-label="หน้าก่อนหน้า"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Page Display */}
                      <div className="flex items-center gap-1 px-2">
                        <span className="text-xs font-bold text-blue-600">{currentPage}</span>
                        <span className="text-xs text-gray-400">/</span>
                        <span className="text-xs font-medium text-gray-500">{totalPages}</span>
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-1 rounded transition-all duration-200 ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed opacity-50'
                            : 'text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95'
                        }`}
                        title="ถัดไป"
                        aria-label="หน้าถัดไป"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Last Page Button */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`p-1 rounded transition-all duration-200 ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed opacity-50'
                            : 'text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95'
                        }`}
                        title="หน้าสุดท้าย"
                        aria-label="ไปหน้าสุดท้าย"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Page Dots Indicator */}
                    <div className="flex items-center justify-center gap-1">
                      {(() => {
                        const renderPageDot = (page: number) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`transition-all duration-200 ${
                              currentPage === page
                                ? 'w-6 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700'
                                : 'w-1.5 h-1.5 rounded-full bg-gray-300 hover:bg-blue-400 hover:w-3'
                            }`}
                            title={`หน้า ${page}`}
                            aria-label={`ไปหน้า ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                          />
                        );

                        // Show all dots if totalPages <= 10
                        if (totalPages <= 10) {
                          return Array.from({ length: totalPages }, (_, i) => i + 1).map(renderPageDot);
                        }

                        // For many pages, show smart dots
                        const dots: number[] = [];
                        
                        if (currentPage <= 5) {
                          // Near start
                          for (let i = 1; i <= Math.min(7, totalPages); i++) dots.push(i);
                        } else if (currentPage >= totalPages - 4) {
                          // Near end
                          for (let i = Math.max(1, totalPages - 6); i <= totalPages; i++) dots.push(i);
                        } else {
                          // Middle
                          for (let i = currentPage - 3; i <= currentPage + 3; i++) {
                            if (i >= 1 && i <= totalPages) dots.push(i);
                          }
                        }

                        return dots.map(renderPageDot);
                      })()}
                    </div>
                  </div>
                )}
                </div>
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
