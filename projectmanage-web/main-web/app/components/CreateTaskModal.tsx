'use client';

import React, { useState, useEffect } from 'react';

import ConfirmPopup from './ComfirmPopup';

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
    beginDate: string;
    beginTime: string;
    color: string;
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
  const [dueTime, setDueTime] = useState('00:00');
  const [beginDate, setBeginDate] = useState('');
  const [beginTime, setBeginTime] = useState('00:00');
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("white");

  const [showConfirm, setShowConfirm] = useState(false);

  const [Success, setSuccess] = useState(false);

  const[changePage, setChangePage] = useState(0);

  const colorClasses: Record<string, string> = {
    white: "bg-white border border-gray-400",
    red: "bg-red-400",
    yellow: "bg-yellow-400",
    green: "bg-green-400",
    blue: "bg-blue-400",
  };

  useEffect(() => {
    if (!Success) return;

    setTaskName('');
    setDescription('');
    setDueDate('');
    setDueTime('00:00');
    setBeginDate('');
    setBeginTime('00:00');
    setAssignedUserId(null);
    setSelectedColor('white');
    setChangePage(0);

    setSuccess(false);
  }, [Success]);

  const handleSubmit = async (done: (status: "success" | "fail") => void) => {
    if (!taskName.trim()) {
      alert('กรุณากรอกชื่อ Task');
      done("fail");
      return;
    }
    
    try {
      await onSubmit({
        taskName: taskName.trim(),
        description: description.trim(),
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        dueTime,
        beginDate: beginDate || new Date().toISOString().split('T')[0],
        beginTime,
        assignedUserId,
        color: selectedColor,
      });

      setSuccess(true);

      done("success");
    } catch (err) {
        console.error("submit failed", err);
        done("fail");
    }
  };

  const resetForm = () => {
    setTaskName('');
    setDescription('');
    setDueDate('');
    setDueTime('00:00');
    setBeginDate('');
    setBeginTime('00:00');
    setAssignedUserId(null);
    setSelectedColor('white')
    setChangePage(0);
    onClose();
  };
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white scale-100 md:scale-105 rounded-xl px-4 shadow-2xl w-full max-w-3xl mx-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className='flex flex-col border-b border-gray-200 '>
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">เพิ่มงานใหม่</h3>
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

          {/* Other Setting */}
          <div className='flex flex-row justify-start items-center px-6 gap-4 md:gap-6'>
            <button 
              onClick={() => setChangePage(0)}
              className={`p-2 bg-white rounded-md text-sm md:text-md ${changePage === 0 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>เนื้อหา</button>
            <button 
              onClick={() => setChangePage(1)}
              className={`p-2 bg-white rounded-md text-sm md:text-md ${changePage === 1 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>กำหนดเวลา</button>
            <button 
              onClick={() => setChangePage(2)}
              className={`p-2 bg-white rounded-md text-sm md:text-md ${changePage === 2 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>หมอบหมายงาน</button>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); setShowConfirm(true); }} className="p-6 space-y-5">
          {changePage === 0 && (
            <div className='overflow-y-scroll scrollbar-autoHide h-75 px-2'>
              <div className='scale-95 md:scale-100 space-y-3'>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ชื่องาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50589C] transition-all outline-none bg-gray-50 focus:bg-white"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50589C] transition-all outline-none bg-gray-50 focus:bg-white resize-none"
                    placeholder="อธิบายรายละเอียดของ Task นี้"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                <div className='flex flex-row items-center space-x-4 py-2'>
                  <span>สีของงาน : </span>
                  {Object.keys(colorClasses).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`
                        p-3 rounded-full
                        ${colorClasses[color]}
                        transition
                        ${
                          selectedColor === color
                            ? "ring-2 ring-offset-2 ring-black"
                            : "hover:ring-2 hover:ring-gray-300"
                        }
                      `}
                    />
                  ))}
                </div>
              </div>
          </div>
          )}

          {changePage === 1 && (
            <div className='overflow-y-scroll scrollbar-autoHide h-75 px-2'>     

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-3 scale-90 md:scale-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เริ่มงาน
                  </label>
                  <input
                    type="date"
                    value={beginDate}
                    onChange={(e) => setBeginDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50589C] transition-all outline-none bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  กำหนดวันเเละเวลาที่จะเริ่มทำงานนี้
                </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เวลาเริ่มงาน
                  </label>
                  <input
                    type="time"
                    value={beginTime}
                    onChange={(e) => setBeginTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50589C] transition-all outline-none bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จบงาน
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50589C] transition-all outline-none bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  กำหนดวันและเวลาที่จะส่งงานนี้
                </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เวลาส่งงาน
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50589C] transition-all outline-none bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>
              </div>            
          </div>
          )}

          {changePage === 2 && (
            <div className='overflow-y-scroll scrollbar-autoHide h-75 px-3'>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  มอบหมายให้
                </label>
                
                <div className="relative">
                  <select
                    value={assignedUserId || ''}
                    onChange={(e) => setAssignedUserId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-4 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#50589C] transition-all outline-none bg-gray-50 focus:bg-white appearance-none text-sm"
                    disabled={isLoading}
                  >
                    <option value="" className='rounded-lg'>ไม่มอบหมายให้ใคร</option>
                    
                    {/* Project Members Options */}
                    {projectMembers.length > 0 && (
                      <>
                        {projectMembers.map((member) => {
                          const userId = member.userInfo?.id || member.user_id_in_project;
                          return (
                            <option 
                              key={member.id} 
                              value={userId}
                              className="py-3 rounded-lg"
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
          </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-red-300 rounded-full transition-all"
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-[#6E8CFB] to-[#50589C] hover:from-[#6E8CFB]/80 hover:to-[#50589C]/80 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>กำลังสร้าง...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>เพิ่มงาน</span>
                </>
              )}
            </button>
            {showConfirm && (
              <ConfirmPopup
                message="ยืนยันการสร้างงาน?"
                description="คุณแน่ใจหรือไม่ว่าต้องการสร้างงานนี้? คุณสามารถแก้ไขงานนี้ได้หลังจากสร้างแล้ว"
                onCancel={() => setShowConfirm(false)}
                onConfirm={(done) => handleSubmit(done)}
                onSuccessClose={() => onClose()}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
