"use client"

import { useState, useEffect, useRef } from 'react';
import axios from 'axios'

import PreviewFile from './previewFile';
import TaskStatusIcon from './TaskStatusIcon';
import { TaskStatusTimeline } from './TaskStatusTimeline';

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

interface Submission {
  id: number;
  documentId?: string;
  task_document_id: string;
  task_id_number: number;
  submitted_by_user_id_number: number;
  submission_date: string;
  submission_description?: string;
  comments?: string;
  file_urls?: string[];
  is_active: boolean;
  cancelled_at?: string;
}

interface User {
  id: number;
  documentId?: string;
  username: string;
  email: string;
}

export default function TaskPopup({task, currentUser, userRole, onClose, onSubmit}: {task: Task | any, currentUser: User | null, userRole: string, onClose?: () => void, onSubmit?: () => void}) {
    const [changePage, setChangePage] = useState(0);
    const [submission, setSubmissions] = useState<Submission[]>([]);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [isOpenFile, setOpenFile] = useState(false);
    const fetchedRef = useRef(false);

    const formatThaiDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    };

    const isTaskOwner = () => {
        if (!task?.assigned_to_user_ids || !currentUser && userRole === 'Member') return false;

        if(userRole === 'Leader') return true;

        return task.assigned_to_user_ids.some(
            (u: any) => u.id === currentUser?.id
        );
    };

    const { getTaskStatusConfig: getUtilityTaskStatusConfig } = require('../utils/taskStatusColors');
  
    const getTaskStatusConfig = (status: string) => {
        const config = getUtilityTaskStatusConfig(status);
        return {
        bgColor: config.lightBgColor,
        borderColor: config.borderColor,
        textColor: config.textColor,
        statusText: config.text,
        statusBg: `${config.lightBgColor} ${config.textColor}`
        };
    };

    const getStatus = getTaskStatusConfig(task.task_status);

    useEffect(() => {
        if (fetchedRef.current) return;
        if (!task?.documentId) return;

        fetchedRef.current = true;

        const fetchSubmission = async () => {
            try {
            const submissionsResponse = await axios.get(
                `/api/submissions?taskDocumentId=${task.documentId}`
            );

            if (
                submissionsResponse.data.success &&
                submissionsResponse.data.submissions
            ) {
                setSubmissions(submissionsResponse.data.submissions);
            }
            } catch (submissionsError) {
            console.error('Could not fetch submissions:', submissionsError);
            }
        };

        fetchSubmission();
        }, [task?.documentId]);

        // useEffect(() => {
        //     console.log('submissions updated:', submission);
        // }, [submission]);

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
                        disabled={!isTaskOwner()}
                        className={`py-2  px-6 rounded-lg scale-90 ${isTaskOwner() ? 'bg-[#50589C] text-white hover:bg-[#50589C]/90 cursor-pointer' : 'bg-gray-300 text-white cursor-not-allowed'}`}>
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
                    {changePage === 2 && (
                    <div className='flex flex-col space-y-3 text-lg'>
                        <span className="border-b pb-2 border-gray-200">งานที่ส่งแล้ว</span>

                        <div className='px-6 py-4 h-85 w-250 rounded-lg overflow-y-scroll scrollbar-autoHide space-y-4'>
                            {/* submission list */}
                            {submission.length > 0 ? (
                            <div className="flex flex-col space-y-3">
                                {submission.map((item, index) => (
                                <button
                                    key={item.id ?? index}
                                    onClick={() => { setPreviewFile(item.file_urls? item.file_urls?.[0] : ''), setOpenFile(true)} }
                                    className="flex flex-col space-y-2 border border-gray-200 rounded-lg p-4 hover:bg-gray-200"
                                >
                                    <div className="flex flex-row justify-between items-center">
                                    {item.submission_description && (
                                        <p className="text-sm text-gray-600">
                                            {item.submission_description}
                                        </p>
                                    )}
                                    <span className="text-sm text-gray-400">
                                        ส่งเมื่อ{' '}
                                        {item.submission_date
                                        ? new Date(item.submission_date).toLocaleDateString('th-TH')
                                        : '-'}
                                    </span>
                                    </div>                               
                                </button>
                                ))}
                            </div>
                            ) : (
                            <div className="text-center text-gray-400 text-sm">
                                ไม่มีงานที่ส่ง
                            </div>
                            )}
                        </div>
                    </div>
                    )}

                    {changePage === 3 && (
                    <div className='flex flex-col items-center space-y-6 text-lg h-full w-full'>
                        <div className='flex flex-col items-center gap-4 mt-6'>
                             <TaskStatusTimeline currentStatus={task.task_status} />
                            
                        </div> 
                        <div className='flex flex-col self-start p-2 w-full h-full gap-4'>
                            <span className='font-bold text-lg'>ประวัติการดำเนินการ</span>
                            <div className='flex flex-col border-1 border-gray-300 rounded-lg h-full w-full p-4 overflow-y-scroll scrollbar-autoHide'>
                                {submission.length > 0 ? (
                                <div className="flex flex-col space-y-3">
                                    {submission.map((item, index) => (
                                    <div
                                        key={item.id ?? index}                              
                                        className="flex flex-row items-center justify-between space-y-2 border text-sm border-gray-200 rounded-lg p-4"
                                    >
                                        {item.submission_description}
                                        <div>{item.submission_date}</div>
          
                                    </div>
                                    ))}
                                </div>
                                ) : (
                                <div className="text-center text-gray-400 text-sm">
                                    ไม่มีประวัติการเคลื่อนไหว
                                </div>
                                )}                        
                            </div>                           
                        </div>                     
                    </div>
                    )}
                    
                </div>
            </div>

            <PreviewFile 
                isOpenFile={isOpenFile} 
                setOpenFile={setOpenFile} 
                previewFile={previewFile} 
                setPreviewFile={setPreviewFile}
            />

        </div>
    );
}