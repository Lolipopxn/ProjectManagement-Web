'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Project {
  id: number;
  project_name: string;
}

interface Task {
  id: number;
  task_name: string;
  due_date: string;
  project: {
    id: number;
    project_name: string;
  };
}

export default function Sidebar() {
  const [myProjectOpen, setMyProjectOpen] = useState(true);
  const [myTaskOpen, setMyTaskOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ใช้ API route แทนการเข้าถึง cookie โดยตรง
        const response = await axios.get('/api/sidebar');
        
        setProjects(response.data.projects || []);
        setTasks(response.data.tasks || []);
        
        if (!response.data.hasAuth) {
          console.log('No authentication for sidebar data');
        }
        
      } catch (error: any) {
        console.error('Failed to fetch sidebar data:', error);
        // ถ้า error เป็น 401 (Unauthorized) ให้ redirect ไป login
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'XX/XX/XXXX';
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // จัดกลุ่ม tasks ตาม project
  const groupedTasks = tasks.reduce((acc, task) => {
    const projectName = task.project?.project_name || 'ไม่ระบุโปรเจ็กต์';
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v6m8-6v6m-8-2h8" />
          </svg>
          <span>Home</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2 mb-6">
          <a 
            href="/overview"
            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors text-center"
          >
            Overview
          </a>
          <a 
            href="/create-project"
            className="bg-green-100 text-green-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-200 transition-colors text-center"
          >
            + Create Project
          </a>
          {/* <button 
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            disabled
          >
            
          </button> */}
        </div>

        {/* My Project Section */}
        <div className="mb-6">
          <button
            onClick={() => setMyProjectOpen(!myProjectOpen)}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span>My Projects</span>
            <svg 
              className={`w-4 h-4 transition-transform ${myProjectOpen ? 'rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {myProjectOpen && (
            <div className="space-y-2 ml-4">
              {loading ? (
                <div className="text-sm text-gray-500">กำลังโหลด...</div>
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <a
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded cursor-pointer transition-colors"
                  >
                    📁 {project.project_name}
                  </a>
                ))
              ) : (
                <div className="text-sm text-gray-500">ไม่มีโปรเจ็กต์ที่เป็นสมาชิก</div>
              )}
            </div>
          )}
        </div>

        {/* My Task Section */}
        <div>
          <button
            onClick={() => setMyTaskOpen(!myTaskOpen)}
            className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
          >
            <span>My Tasks</span>
            <svg 
              className={`w-4 h-4 transition-transform ${myTaskOpen ? 'rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {myTaskOpen && (
            <div className="space-y-4 ml-4">
              {loading ? (
                <div className="text-sm text-gray-500">กำลังโหลด...</div>
              ) : Object.keys(groupedTasks).length > 0 ? (
                Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
                  <div key={projectName}>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      📁 {projectName}
                    </div>
                    <div className="space-y-1 ml-4">
                      {projectTasks.map((task) => (
                        <div key={task.id} className="text-xs text-gray-600 hover:text-blue-600 p-1 rounded cursor-pointer transition-colors">
                          <div>📋 {task.task_name}</div>
                          <div className="text-red-500 ml-4">
                            ครบกำหนด {formatDate(task.due_date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">ไม่มีงานในโปรเจ็กต์ที่เป็นสมาชิก</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
