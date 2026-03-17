import TaskStatusIcon from "../components/TaskStatusIcon";

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

type TaskStatusConfig = {
  bgColor: string;
  borderColor: string;
  textColor: string;
  statusText: string;
  statusBg: string;
};

interface TaskProps {
  task: Task;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setPopupTask: React.Dispatch<React.SetStateAction<boolean>>;
  userRole: string;
  setShowTaskManageModal: React.Dispatch<React.SetStateAction<boolean>>;
  getTaskStatusConfig: (status: string) => TaskStatusConfig;
  getTimeLeft: (dueDate: string, beginDate: string) => React.ReactNode;
}

export default function RenderTaskCard({
  task,
  setSelectedTask,
  setPopupTask,
  userRole,
  setShowTaskManageModal,
  getTaskStatusConfig,
  getTimeLeft,
}: TaskProps) {
  const taskStatusConfig = getTaskStatusConfig(task.task_status);

  return (
    <div
      className={`
          border border-gray-200 rounded-lg p-5 md:mb-4 shadow-[0px_0px_0_rgba(0,0,0,0)]
            hover:shadow-[4px_4px_0_rgba(0,0,0,0.25)] hover:border-gray-300 hover:bg-gray-50 hover:-translate-1
            dark:hover:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:shadow-lg dark:bg-gray-700
            transition-all duration-300
            relative overflow-hidden
            ${task.task_status === "continue" && task.task_type === "normal_task" ? "relative hover:bg-blue-50 shadow-blue-300" : ""}
             ${task.task_status === "not turn in" && task.task_type === "normal_task"  && "border-2 border-yellow-400 hover:bg-yellow-50 hover:border-yellow-100 shadow-yellow-300"}
            ${task.task_status === "completed" && task.task_type === "normal_task"  && "border-2 border-green-300 hover:bg-green-50 hover:border-green-100 shadow-green-300"}
            ${task.task_status === "rejected" && task.task_type === "normal_task" && " border-2 border-rose-300 hover:bg-rose-50 hover:border-rose-100 shadow-rose-300"}

            ${task.task_status === "completed" && task.task_type === "location_task"  && "bg-gray-50 border-1 border-gray-300 hover:bg-gray-100 hover:border-gray-200"}
        }`}
      onClick={() => {
        setSelectedTask(task);
        setPopupTask(true);
        // if (task.documentId) {
        //   router.push(`/main_pages/projects/${projectId}/tasks/${task.documentId}`);
        // } else {
        //   console.warn('Task documentId not found:', task);
        //   // alert('ไม่พบ documentId ของ Task นี้');
        // }
      }}
    >
      {/* Border animation  */}
      {task.task_status === "continue" && (
          <svg className="running-border-svg" aria-hidden="true">
              <rect className="running-border-rect" />
          </svg>      
      )}

      {/* Task Name with Actions */}
      <div className="flex items-start justify-between mb-1 md:mb-10">
        <div className="flex-1 truncate">
          <h5 className="font-semibold text-sm md:text-lg cursor-pointer transition-colors leading-tight">
            {task.task_name}
          </h5>
        </div>

        {/* Task Management Button - Only for Leaders */}
        {userRole === "Leader" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTask(task);
              setShowTaskManageModal(true);
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            title="จัดการงาน"
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Task Details - Compact Layout */}
      <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 gap-4 md:px-2">
        {/* Status */}
        <div
          className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${taskStatusConfig.bgColor} ${taskStatusConfig.textColor}`}
        >
          <TaskStatusIcon status={task.task_status} className="w-4 h-4" />
          <span>{taskStatusConfig.statusText}</span>
        </div>

        {/* Due Date */}
        <div
          className={`flex flex-row items-center space-x-2 
            ${
              task.task_status === "completed" ||
              task.task_status === "pending_review"
                ? "hidden"
                : "flex"
            } `}
        >
          <span className="text-gray-700 text-sm dark:text-gray-300">
            {getTimeLeft(task.due_date, task.begin_date)}
          </span>
        </div>
      </div>
    </div>
  );
}
