'use client';

import React, { useState } from 'react';

interface ProjectMember {
  id: number;
  documentId?: string;
  role_in_project: string;
  join_date: string;
  project_id_number: number;
  user_id_in_project: number;
  project_document_id: string;
  user_ids?: any;
  userInfo?: {
    id: number;
    username: string;
    email?: string;
  };
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    taskName: string;
    description: string;
    dueDate: string;
    dueTime: string;
    assignedUserId: number | null;
  }) => void;
  projectMembers: ProjectMember[];
  isLoading: boolean;
}

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projectMembers, 
  isLoading 
}: CreateTaskModalProps) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      alert('กรุณากรอกชื่อ Task');
      return;
    }
    
    onSubmit({
      taskName: taskName.trim(),
      description: description.trim(),
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      dueTime: dueTime,
      assignedUserId: assignedUserId
    });
  };

  const resetForm = () => {
    setTaskName('');
    setDescription('');
    setDueDate('');
    setDueTime('23:59');
    setAssignedUserId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white scale-80 md:scale-90 rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">สร้าง Task ใหม่</h3>
              <p className="text-sm text-gray-500">เพิ่มงานใหม่ให้กับโปรเจ็กต์</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ชื่อ Task <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white"
              placeholder="ป้อนชื่อ Task ที่ต้องการสร้าง"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              รายละเอียด
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white resize-none"
              placeholder="อธิบายรายละเอียดของ Task นี้"
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                วันที่กำหนดส่ง
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เวลากำหนดส่ง
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              มอบหมายให้
            </label>
            
            <div className="relative">
              <select
                value={assignedUserId || ''}
                onChange={(e) => setAssignedUserId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white appearance-none text-sm"
                disabled={isLoading}
              >
                <option value="">ไม่มอบหมายให้ใคร</option>
                
                {/* Project Members Options */}
                {projectMembers.length > 0 && (
                  <>
                    {projectMembers.map((member) => {
                      const userId = member.userInfo?.id || member.user_id_in_project;
                      return (
                        <option 
                          key={member.id} 
                          value={userId}
                          className="py-3"
                        >
                          {member.userInfo?.username || `User ${userId}`} • {member.role_in_project}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Helper text */}
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              สามารถปล่อยว่างได้หากไม่ต้องการมอบหมายให้ใคร
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-xl transition-all"
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>กำลังสร้าง...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>สร้าง Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
