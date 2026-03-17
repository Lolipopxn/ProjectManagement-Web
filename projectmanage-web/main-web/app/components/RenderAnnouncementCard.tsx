import { AiFillNotification } from "react-icons/ai";
import { IoCalendar } from "react-icons/io5";

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
}

interface TaskProps {
  task: Task;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setPopupTask: React.Dispatch<React.SetStateAction<boolean>>;
  userRole: string;
  setShowTaskManageModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RenderAnnouncementCard({
  task,
  setSelectedTask,
  setPopupTask,
  userRole,
  setShowTaskManageModal,
}: TaskProps) {
  return (
    <div
      className="
        border-2 border-gray-300 rounded-xl p-5
        hover:shadow-[4px_4px_0_rgba(0,0,0,0.25)] hover:bg-gray-50 hover:-translate-y-0.5
        dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600
        transition-all duration-300 cursor-pointer truncate
      "
      onClick={() => {
        setSelectedTask(task);
        setPopupTask(true);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between truncate">
        <div className="flex flex-row items-center gap-4 ">
          <div className="flex flex-row items-center gap-2 font-semibold text-sm md:text-lg leading-tight text-gray-600 dark:text-gray-100 ">
            <AiFillNotification  className="size-6 md:size-8 text-red-400 border rounded-full p-1"/>
            <span className="max-w-30 md:max-w-200 truncate">{task.task_name}</span>
          </div>

          <span
            className="hidden md:block px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-300 dark:text-gray-600"
          >
            Announcement
          </span>
        </div>       

        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 px-4">
          {/* Date */}
          <span className="flex flex-row items-center gap-2">
            <IoCalendar className="size-4 md:size-6"/>

            {new Date(task.createdAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>

          {userRole === "Leader" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTask(task);
                setShowTaskManageModal(true);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-900 hover:text-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            >
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
                  d="M12 5v.01M12 12v.01M12 19v.01"
                />
              </svg>
            </button>
          )}      
        </div>     
      </div>  
  </div>
  );
}