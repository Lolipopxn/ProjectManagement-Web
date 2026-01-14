"use client"

import { useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios'
import dayjs from "dayjs";
import "dayjs/locale/th";

import PreviewFile from './previewFile';
import { TaskStatusTimeline } from './TaskStatusTimeline';
import AssignUserModal from './AssignUserModal';
import ViewLocationMap from './map/ViewLocationMap';

import { IoMdClose } from "react-icons/io";
import { CgProfile } from "react-icons/cg";
import { FaRegEdit, FaPlus, FaTag } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { BsArrowReturnRight } from "react-icons/bs";
import { RiArrowRightSLine } from "react-icons/ri";
import { rejects } from 'assert';

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
  task_type: string;
  project_document_id: string;
  assigned_to_user_ids_number: number;
  assigned_to_user_ids?: any;
  project_id?: any;
  attributes?: any;
  task_status_histories?: any[];
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
  review_status?: 'pending' | 'approved' | 'rejected';
  reviewed_at?: string;
  reviewed_by_user_id?: number;
  submittedByUser?: {
    id: number;
    username: string;
    email?: string;
  };
}

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
    documentId?: string;
    username: string;
    email?: string;
  };
}

interface User {
  id: number;
  documentId?: string;
  username: string;
  email: string;
}

export default function TaskPopup({projectId, task, setSelectedTask, projectMembers, currentUser, userRole, onClose, onSubmit, onRefresh, refreshTaskMembers}
    : {
        projectId: number, 
        task: Task | any, 
        setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>,
        projectMembers: ProjectMember[], 
        currentUser: User | null, 
        userRole: string, 
        onClose?: () => void, 
        onSubmit?: () => void, 
        onRefresh?: () => void,
        refreshTaskMembers: boolean,
    }) {
    const [changePage, setChangePage] = useState(0);
    const [submission, setSubmissions] = useState<Submission[]>([]);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [isOpenFile, setOpenFile] = useState(false);
    const fetchedRef = useRef(false);
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [loadingUserId, setLoadingUserId] = useState<number | null>(null);
    const [isOpenEdit, setOpenEdit] = useState(false);

    const formatThaiDate = (date?: string) => {
        if (!date) return "-";
        const d = new Date(date);

        const datePart = d.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        const timePart = d.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        return `${datePart} • ${timePart}`;
    };



    const getTimeLeft = (dueDate: string, beginDate: string) => {
        const now = dayjs();
        const due = dayjs(dueDate);
        const begin = dayjs(beginDate);
    
        const daysBegin = dayjs.duration(begin.diff(now)).asDays();
    
        if(now.isBefore(begin)) {
          return <div>เริ่มในอีก {Math.floor(daysBegin)} วัน</div>
        }
    
        if(begin.isBefore(now)){
          if (due.isBefore(now)) {
            return <div className="text-red-700 bg-red-300 rounded-full px-2 py-1 flex items-center justify-center">
                เลยกำหนด
            </div>;
          }
    
          const diff = dayjs.duration(due.diff(now));
          const days = diff.asDays();
    
          if (days >= 1) {
            return <div>เหลือ {Math.floor(days)} วัน</div>;
          }
          
          const hours = diff.asHours();
          if (hours >= 1) {
            return <div>เหลือ {Math.floor(hours)} ชั่วโมง</div>;
          }
          
          const minutes = diff.asMinutes();
          return <div>เหลือ {Math.floor(minutes)} นาที</div>;
        }
      };

    const getUserRoleInProject = (userId: number) => {
        const member = projectMembers.find(
            (m) => m.user_id_in_project === userId
        );

        return ROLE_LABELS[member?.role_in_project as string] ?? '-';
    };

    const ROLE_LABELS: Record<string, ReactNode> = {
        Leader: (
            <span className="px-2 py-1 text-sm rounded-full border border-purple-700 bg-purple-200 text-purple-700">
            หัวหน้า
            </span>
        ),
        member: (
            <span className="px-2 py-1 text-sm rounded-full border border-green-700 bg-green-100 text-green-700">
            สมาชิก
            </span>
        ),
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

    const STATUS_BUTTON: Record<string, {
        label: string;
        onClick?: () => void;
        className: string;
        disabled?: boolean;
        }> = {
        'not turn in': {
            label: 'เริ่มงาน',
            onClick: () => updatedTaskStatus('continue', 'เริ่มต้นการทำงาน'),
            className: 'bg-[#50589C] hover:bg-[#50589C]/80 shadow-md text-white',
        },
        continue: {
            label: 'หยุดงาน',
            onClick: () => updatedTaskStatus('not turn in', 'หยุดการทำงาน'),
            className: 'bg-red-400 hover:bg-red-600 shadow-md text-white',
        },
        pending_review: {
            label: 'รออนุมัติ',
            className: 'bg-gray-100 text-gray-700 border border-gray-700',
            disabled: true,
        },
        completed: {
            label: 'เสร็จสมบูรณ์',
            className: 'bg-green-100 text-green-700 border border-green-700',
            disabled: true,
        },
        rejected: {
            label: 'แก้ไขงาน',
            onClick: () => updatedTaskStatus('continue', 'กำลังแก้ไขงานหลังจากถูกปฏิเสธ'),
            className: 'bg-blue-400 hover:bg-blue-600 shadow-md text-white',
        },
    };

    const ANNOUNCEMENT_BUTTON: Record<string, {
        label: string;
        onClick?: () => void;
        className: string;
        disabled?: boolean;
        }> = {
        'not turn in': {
            label: 'จบกิจกรรม',
            onClick: () => updatedTaskStatus('completed', 'สิ้นสุดกิจกรรม'),
            className: 'bg-[#50589C] hover:bg-[#50589C]/80 shadow-md text-white',
        },
        continue: {
            label: 'จบกิจกรรม',
            onClick: () => updatedTaskStatus('completed', 'สิ้นสุดกิจกรรม'),
            className: 'bg-[#50589C] hover:bg-[#50589C]/80 shadow-md text-white',
        },
        pending_review: {
            label: 'จบกิจกรรม',
            onClick: () => updatedTaskStatus('completed', 'สิ้นสุดกิจกรรม'),
            className: 'bg-[#50589C] hover:bg-[#50589C]/80 shadow-md text-white',
        },
        completed: {
            label: 'กิจกรรมสิ้นสุดเเล้ว',
            className: 'bg-green-100 text-green-700 border border-green-700',
            disabled: true,
        },
        rejected: {
            label: 'แก้ไข',
            onClick: () => updatedTaskStatus('continue', 'กำลังแก้ไขงานหลังจากถูกปฏิเสธ'),
            className: 'bg-blue-400 hover:bg-blue-600 shadow-md text-white',
        },
    };


    const getFileUrl = (fileUrl: string) => {
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl;
        }
        
        if (fileUrl.startsWith('/uploads')) {
            return `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${fileUrl}`;
        }
        
        const cleanUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        return `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/uploads${cleanUrl}`;
    };

    // Helper function to extract filename from URL
    const getFileNameFromUrl = (fileUrl: string) => {
        try {
        if (!fileUrl) return 'unknown-file';
        
        const urlParts = fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        return decodeURIComponent(fileName);
        } catch (error) {
        console.error('Error extracting filename:', error);
        return fileUrl.split('/').pop() || 'unknown-file';
        }
    };

    const refreshTask = async () => {
        const res = await axios.get(
            `/api/tasks/${task.documentId}`
        );

        if (res.data?.task) {
            setSelectedTask(res.data.task);
            onRefresh?.();
        }
     };

     const updatedTaskStatus = async (newStatus: string, note: string) => {
        await axios.put('/api/tasks/updateStatus', {
            documentId: task.documentId,
            task_status: newStatus,
            note: note || '',
        });

        refreshTask();
     };

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
                        <div className='flex flex-row flex-1 gap-4 items-center'>
                            <span className=' text-3xl truncate'>{task.task_name}</span>
                            <div className={`flex flex-row items-center gap-2 bg-gray-200 rounded-full py-1 px-2 mt-2 border border-gray-400
                                ${task.task_type === 'location_task' && 'bg-purple-200 border-purple-400'}
                            `}>
                                <FaTag className='size-3'/>
                                <span className='text-sm'>{task.task_type === 'normal_task' ? 'งานทั่วไป' : 'ประกาศ' }</span>
                            </div>
                        </div>
                        
                        <button onClick={onClose}>
                            <IoMdClose className="size-6"/>
                        </button>                    
                    </div>
                    <div className="flex flex-row justify-between items-center px-4">
                        <div className='flex flex-row justify-start items-center gap-6'>
                            <button 
                                onClick={() => setChangePage(0)}
                                className={`p-2 bg-white rounded-md  ${changePage === 0 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>รายละเอียด</button>
                        
                            {task.task_type === 'location_task' && (
                                <button 
                                onClick={() => setChangePage(4)}
                                className={`p-2 bg-white rounded-md  ${changePage === 4 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>สถานที่</button>
                            )}                        

                            <button 
                                onClick={() => setChangePage(1)}
                                className={`p-2 bg-white rounded-md  ${changePage === 1 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>ผู้ได้รับหมอบหมาย</button>
                            
                            <button 
                                onClick={() => setChangePage(2)}
                                className={`p-2 bg-white rounded-md  ${changePage === 2 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>`{task.task_type === 'normal_task'? "งานที่ส่งเเล้ว" :"ไฟล์ที่เกี่ยวข้อง"}</button>
                            <button 
                                onClick={() => setChangePage(3)}
                                className={`p-2 bg-white rounded-md  ${changePage === 3 ? 'text-black border-b-2 border-[#50589C] rounded-b-none' : 'text-gray-400'} hover:bg-gray-100`}>{task.task_type === 'normal_task'? "สถานะงาน" :"สถานะ"}</button>   
                        </div>
                        
                        <button 
                            onClick={onSubmit}
                            disabled={!isTaskOwner()}
                            className={`py-2  px-6 rounded-lg scale-90 ${isTaskOwner() ? 'bg-[#50589C] text-white hover:bg-[#50589C]/90 cursor-pointer' : 'bg-gray-300 text-white cursor-not-allowed'}`}
                        >
                            {task.task_type === 'normaltask' ? 'ส่งงาน' : 'เเนบไฟล์'}
                        </button>
                        
                    </div>
                </div>
                <div className='h-100 flex flex-col bg-white space-y-3 px-6'>
                    {changePage === 0 && (
                        <div className="flex flex-row gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* LEFT : Description */}
                            <div className="flex flex-col flex-[2] bg-white rounded-xl ">
                                <div className="flex flex-row items-center justify-between py-4 border-b border-gray-300">
                                    <h3 className="text-lg font-semibold">คำอธิบาย</h3>
                                    {STATUS_BUTTON[task.task_status] && task.task_type === 'normal_task' && (
                                        <button
                                            key={task.task_status}
                                            onClick={STATUS_BUTTON[task.task_status].onClick}
                                            disabled={STATUS_BUTTON[task.task_status].disabled}
                                            className={`
                                                py-1 px-3 rounded-md
                                                transition duration-300
                                                animate-in fade-in slide-in-from-bottom-2
                                                ${STATUS_BUTTON[task.task_status].className}
                                                ${STATUS_BUTTON[task.task_status].disabled ? 'cursor-not-allowed' : ''}
                                            `}
                                        >
                                            {STATUS_BUTTON[task.task_status].label}
                                        </button>
                                    )}

                                    {ANNOUNCEMENT_BUTTON[task.task_status] && task.task_type === 'location_task' && (
                                        <button
                                            key={task.task_status}
                                            onClick={ANNOUNCEMENT_BUTTON[task.task_status].onClick}
                                            disabled={ANNOUNCEMENT_BUTTON[task.task_status].disabled}
                                            className={`
                                                py-1 px-3 rounded-md
                                                transition duration-300
                                                animate-in fade-in slide-in-from-bottom-2
                                                ${ANNOUNCEMENT_BUTTON[task.task_status].className}
                                                ${ANNOUNCEMENT_BUTTON[task.task_status].disabled ? 'cursor-not-allowed' : ''}
                                            `}
                                        >
                                            {ANNOUNCEMENT_BUTTON[task.task_status].label}
                                        </button>
                                    )}
                                    
                                </div>

                                <div className="px-2 py-4 h-85 overflow-y-scroll scrollbar-autoHide whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {task.description}
                                </div>
                            </div>

                            {/* RIGHT : Task Schedule */}
                            <div className="flex flex-col flex-1 px-6 bg-white rounded-xl shadow-md border border-gray-200
                                            transition hover:shadow-lg hover:-translate-y-1 duration-300">
                                <div className="px-6 py-4 border-b border-gray-300 text-center">
                                    <h3 className="text-lg font-semibold">กำหนดงาน</h3>
                                </div>

                                <div className="py-5 space-y-4 text-md text-gray-700">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">เริ่มงาน:</span>
                                        <span className="font-medium text-sm">
                                            {formatThaiDate(task.begin_date)}                                        
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">จบงาน:</span>
                                        <span className="font-medium text-sm">
                                            {formatThaiDate(task.due_date)}
                                        </span>
                                    </div>

                                    <div className="pt-3 border-t border-gray-300 flex justify-between items-center">
                                        <span className="text-gray-500">เวลาที่เหลือ:</span>
                                        {task.task_status === "completed" && (
                                            <span className="py-1 px-2 rounded-full text-sm font-medium bg-green-200 text-green-800 animate-pulse ">
                                                เสร็จสมบูรณ์
                                            </span>
                                        )}
                                        {task.task_status === "pending_review" && (
                                            <span className="py-1 px-2 rounded-full text-sm font-medium bg-blue-200 text-blue-800 animate-pulse ">
                                                รอการตรวจสอบ
                                            </span>
                                        )}
                                        <span className={`py-1 rounded-full text-sm font-medium animate-pulse
                                            ${task.task_status === "completed" || task.task_status === "pending_review" ? 'hidden' : 'flex'}`}>
                                            {getTimeLeft(task.due_date, task.begin_date)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">สถานะงาน:</span>
                                        <span
                                            key={task.task_status}
                                            className="font-medium text-sm inline-block
                                                        animate-in fade-in slide-in-from-left-2 duration-300"
                                        >
                                            {task.task_status === "not turn in" && "ยังไม่ส่ง"}
                                            {task.task_status === "completed" && "ส่งเเล้ว"}
                                            {task.task_status === "pending_review" && "รอหัวหน้าอนุมัติ"}
                                            {task.task_status === "continue" && "กำลังทำอยู่"}
                                            {task.task_status === "rejected" && "ถูกปฏิเสธ"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                        )}

                    {changePage === 4 && (
                        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-scroll scrollbar-autoHide">
                            <div className='flex flex-row items-center gap-2'>
                               <div>สถานที่นัดหมาย: </div> 
                               <div>{task.address? task.address : 'ไม่ได้เลือกสถานที่'}</div>
                            </div>  
                            {task.task_type === 'location_task' && task.latitude && task.longitude && (                 
                                <ViewLocationMap position={{ lat: task.latitude, lng: task.longitude }}/>  
                            )}                    
                        </div>                                       
                    )}                  

                    {changePage === 1 && (
                        <div className='flex flex-col space-y-2 text-lg animate-in fade-in slide-in-from-bottom-2 duration-300'> 
                            <div className="flex flex-row items-center px-4 justify-between border-b pb-2 border-gray-200">
                                <span>รายชื่อผู้ได้รับหมอบหมายงาน</span>
                                <div className='flex flex-row items-center gap-2'>
                                    <button onClick={() => {setOpenEdit((prev) => !prev)}} className={`py-2 px-4 text-sm rounded-md text-white transition ${
                                        isOpenEdit
                                        ? 'bg-[#50589C]'
                                        : 'bg-gray-400 hover:bg-gray-700'
                                    }`}>
                                        <FaRegEdit className='size-4' />
                                    </button>
                                    <button onClick={() => setAssignModalOpen(true)} className='py-2 px-4 bg-[#696FC7] text-sm rounded-md text-white hover:bg-[#50589C]/90'>
                                        <FaPlus className='size-4' />
                                    </button>
                                </div>
                                
                            </div>
                            <div className='mt-4 px-2 w-full h-85  whitespace-pre-wrap overflow-y-scroll scrollbar-autoHide border-b border-gray-300'>                       
                                <div className='w-full border border-[#50589C] shadow-md'>
                                    <table className='table-auto w-full h-auto'>
                                        <thead className='bg-[#50589C] text-white sticky top-0 z-10'>
                                            <tr className='h-12 [&>th]:text-start [&>th]:pl-6'>
                                                <th>ชื่อผู้ใช้</th>
                                                <th>อีเมล</th>
                                                <th>สิทธ์</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {task.assigned_to_user_ids?.map((user: any) => (
                                                <tr key={user.id} className='border-b border-gray-200 h-12 text-md [&>td]:text-start [&>td]:pl-6'>
                                                    <td>
                                                        <div className='flex flex-row items-center gap-2'>
                                                            <CgProfile className='size-6'/> 
                                                            {user.username} 
                                                        </div>
                                                    </td>
                                                    <td>{user.email}</td>
                                                    <td className='w-32 px-2'>
                                                        <div className='flex flex-row items-center justify-between '>
                                                           {getUserRoleInProject(user.id)}
                                                           {/* button delete */}
                                                           {isOpenEdit && (
                                                            <button 
                                                                disabled={loadingUserId === user.id}
                                                                onClick={async () => {
                                                                    setLoadingUserId(user.id);
                                                                    await axios.post('/api/tasks/remove-user', {
                                                                        taskId: task.documentId,
                                                                        userId: user.id,
                                                                    });

                                                                    await refreshTask();
                                                                }}
                                                                className='p-1 hover:bg-red-200 rounded-md'
                                                            >
                                                                {loadingUserId === user.id ? (
                                                                    <span className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin block" />
                                                                ) : (
                                                                    <MdDelete className="size-6 text-red-500" />
                                                                )}
                                                            </button>
                                                           )}
                                                        </div>                                              
                                                    </td>
                                                </tr>
                                            ))}                                  
                                        </tbody>
                                    </table>                                         
                                </div>   
                            </div>                   
                        </div>                    
                    )}
                    {changePage === 2 && (
                    <div className='flex flex-col space-y-3 text-lg animate-in fade-in slide-in-from-bottom-2 duration-300'>
                        <span className="border-b pb-2 border-gray-200">งานที่ส่งแล้ว</span>

                        <div className='px-6 py-4 h-85 w-250 rounded-lg overflow-y-scroll scrollbar-autoHide space-y-4'>
                            {/* submission list */}
                            {submission.filter(s => s.file_urls && s.file_urls.length > 0 && s.is_active).length > 0 ? (
                            <div className="flex flex-col space-y-3 w-full h-full">
                                {submission
                                    .filter(s => s.file_urls && s.file_urls.length > 0 && s.is_active)
                                    .map((item, index) => (
                                <div
                                    key={item.id ?? index}
                                    className="flex flex-col space-y-2 border border-gray-200 rounded-lg p-4"
                                >
                                    <span className="text-sm text-center text-gray-400">
                                        ส่งเมื่อ{' '}
                                        {item.submission_date
                                        ? new Date(item.submission_date).toLocaleDateString('th-TH')
                                        : '-'}
                                    </span>
                                    <div className="flex flex-row justify-between items-center">                                
                                        {/* File List */}
                                        <div className="space-y-2 mt-2 flex-1">
                                        {item.file_urls?.map((fileUrl, index) => {
                                            const fullFileUrl = getFileUrl(fileUrl);
                                            const fileName = getFileNameFromUrl(fileUrl);
                                            
                                            return (
                                            <div key={index} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-100 transition-colors group">
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                                                        {fileName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                                                    <a 
                                                        href={fullFileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-1.5"
                                                        title="ดาวน์โหลดไฟล์"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </a>
                                                    <button
                                                        onClick={() => { setPreviewFile(fullFileUrl); setOpenFile(true); }}
                                                        className="px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-1.5"
                                                        title="ดูไฟล์"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>                                 
                                </div>                               
                            </div>
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
                    <div className='flex flex-col items-center space-y-6 text-lg h-full w-full animate-in fade-in slide-in-from-bottom-2 duration-300'>
                        <div className='flex flex-col items-center gap-4 mt-6'>
                             <TaskStatusTimeline currentStatus={task.task_status} />                         
                        </div> 
                        <div className='flex flex-col self-start p-2 w-full h-full gap-4'>
                            <span className='font-bold text-lg'>ประวัติการดำเนินการ</span>
                            <div className='flex flex-col border-1 border-gray-300 rounded-lg h-53 w-full p-4 overflow-y-scroll scrollbar-autoHide animate-in fade-in slide-in-from-bottom-2 duration-500'>
                                {task.task_status_histories?.length > 0 ? (
                                <div className="flex flex-col space-y-3">
                                    {[...task.task_status_histories]
                                        .sort(
                                            (a, b) =>
                                            new Date(b.changed_at).getTime() -
                                            new Date(a.changed_at).getTime()
                                        )
                                        .map((item: any, index: number) => (
                                    <div
                                        key={item.id ?? index}                              
                                        className="flex flex-col items-start justify-start space-y-2 border text-sm border-gray-200 rounded-lg p-4"
                                    >
                                        <div className='flex flex-row justify-between w-full'>
                                            <div className='flex flex-row items-center gap-2'>
                                                <div className="text-sm">
                                                    สถานะ: {getTaskStatusConfig(item.from_status ? item.from_status : '').statusText}
                                                </div>
                                                <RiArrowRightSLine className='size-4'/>
                                                <div className="text-sm">
                                                    {getTaskStatusConfig(item.to_status? item.to_status : '').statusText}
                                                </div>
                                            </div>
                                        
                                            <div className='text-gray-500'>{item.changed_at ? new Date(item.changed_at).toLocaleDateString('th-TH') : '-'}</div>
                                        </div>
                                        
                                        <div>
                                            {item.note && (
                                                <div className='flex flex-row items-center justify-center gap-2 mt-2'>
                                                    <BsArrowReturnRight className='size-4' />
                                                    <div className={`${getTaskStatusConfig(item.to_status ? item.to_status : '').textColor}`}>{item.note}</div>
                                                </div>
                                                
                                            )}
                                        </div>
                                        
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

            <AssignUserModal
                isOpen={isAssignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                projectMembers={projectMembers}
                assignedUserIds={
                    task.assigned_to_user_ids?.map((u: any) => u.id) ?? []
                }
                onAssign={async (userId) => {
                    setLoadingUserId(userId);
                    await axios.post('/api/tasks/assign-user', {
                    taskId: task.documentId,
                    projectId: projectId,
                    userId,
                    });
                                     
                   await refreshTask();    
                   setLoadingUserId(null); 
                }}
                
                loadingUserId={loadingUserId}
                refreshTaskMembers={refreshTaskMembers}
            />

        </div>
    );
}