"use client"

import { useState } from 'react';
import { IoMdClose } from "react-icons/io";
import { CgProfile } from "react-icons/cg";

interface Task {
  id: number;
  documentId?: string;
  task_name: string;
  description: string;
  task_status: string;
  due_date: string;
  begin_date: string;
  createdAt: string;
  task_color: string;
  project_document_id: string;
  assigned_to_user_ids_number: number;
  assigned_to_user_ids?: any;
  project_id?: any;
  attributes?: any;
}

export default function TaskPopup({task, onClose, onSubmit}: {task: Task | any, onClose?: () => void, onSubmit?: () => void}) {
    const [changePage, setChangePage] = useState(0);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 truncate">
            <div className="w-full max-w-6xl mx-auto px-10 py-10 space-y-6 bg-white shadow-2xl rounded-xl scale-80 md:scale-105 transition-all duration animate-in slide-in-from-bottom-4">
                <div className="flex flex-col border-b border-gray-300 space-y-6">
                    <div className="flex flex-row justify-between px-4">
                        <div className="flex-1 text-3xl truncate">{task.task_name}</div>
                        <button onClick={onClose}>
                            <IoMdClose className="size-6"/>
                        </button>                    
                    </div>
                    <div className="flex flex-row justify-between items-center px-4">
                        <div className='flex flex-row justify-start items-center gap-6'>
                            <button 
                                onClick={() => setChangePage(0)}
                                className={`p-2 bg-white rounded-md  ${changePage === 0 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>รายละเอียด</button>
                        
                            <button 
                                onClick={() => setChangePage(1)}
                                className={`p-2 bg-white rounded-md  ${changePage === 1 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>ผู้ได้รับหมอบหมาย</button>
                            
                            <button 
                                onClick={() => setChangePage(2)}
                                className={`p-2 bg-white rounded-md  ${changePage === 2 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>งานที่ส่งเเล้ว</button>
                            <button 
                                onClick={() => setChangePage(3)}
                                className={`p-2 bg-white rounded-md  ${changePage === 3 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>สถานะงาน</button>   
                        </div>
                        <button 
                        onClick={onSubmit}
                        className='py-2 bg-[#50589C] text-white hover:bg-[#50589C]/90 px-6 rounded-lg scale-90'>
                            ส่งงาน
                        </button>
                        
                    </div>
                </div>
                <div className='h-100 flex flex-col bg-white space-y-3 px-6'>
                    {changePage === 0 && (
                        <div className='flex flex-col space-y-2 text-lg'>
                            <span className="border-b pb-2 border-gray-200">คำอธิบาย</span>
                            <div className='px-6 py-2 h-85 w-250  rounded-lg whitespace-pre-wrap overflow-y-scroll scrollbar-autoHide'>
                                <p>{task.description}</p>
                            </div>                    
                        </div>                    
                    )}

                    {changePage === 1 && (
                        <div className='flex flex-col space-y-2 text-lg'>
                            <span className="border-b pb-2 border-gray-200"></span>
                            <div className='px-6 py-2 h-85 w-200  rounded-lg whitespace-pre-wrap overflow-y-scroll scrollbar-autoHide'>
                                <div className='flex flex-row items-center gap-4'>
                                    <CgProfile className='size-6'/>
                                    <span>{task.assigned_to_user_ids?.length ? `${task.assigned_to_user_ids.map((u: any ) => u.username).join(", ")}` : "ไม่มอบหมายงาน"}</span>
                                </div>
                                          
                            </div>                    
                        </div>                    
                    )}
                    
                </div>
            </div>
        </div>
    );
}