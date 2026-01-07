import { motion } from 'framer-motion';
import { TaskStatusIcon } from './TaskStatusIcon';
import { TASK_STATUS_FLOW } from '../utils/taskStatusFlow';

interface Props {
  currentStatus: string;
}

export const TaskStatusTimeline: React.FC<Props> = ({ currentStatus }) => {
  const FINAL_STATUSES = ['completed', 'rejected'];

  const isFinal = FINAL_STATUSES.includes(currentStatus);

  const activeIndex = isFinal
    ? TASK_STATUS_FLOW.length - 1
    : Math.max(
        0,
        TASK_STATUS_FLOW.findIndex((s) => s.key === currentStatus)
      );

  return (
    <div className="flex items-center py-6 bg-white rounded-xl">
      {TASK_STATUS_FLOW.map((step, index) => {
        const isActive = index === activeIndex;
        const isInactive = index > activeIndex;

        const isFinalNode = step.key === 'final';

        const nodeStatus =
        isFinalNode && isActive
            ? currentStatus
            : step.key;

        const nodeColor = isInactive
        ? 'text-gray-300'
        : 'text-gray-900';

        return (
          <div key={step.key} className="flex items-center">
            {/* Node */}
            <motion.div
              animate={
                isActive
                  ? { scale: [1, 1.15, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.6 }}
              className={`relative ${nodeColor} group`}
            >
              <TaskStatusIcon
                status={nodeStatus}
                className={`size-13 rounded-full ${
                  isInactive ? 'text-gray-300 ' : 'border-2'
                }`}
              />

              {/* Label */}
              <div className="absolute top-14 left-1/2 -translate-x-1/2 text-sm tracking-tight text-gray-600 whitespace-nowrap">
                {isFinalNode && isActive
                    ? currentStatus === 'rejected'
                        ? 'ไม่ผ่าน'
                        : 'เสร็จสิ้น'
                    : step.label
                }              
              </div>

              {isActive && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-900 whitespace-nowrap">
                    ปัจจุบัน 
                </div>
                )}

                {/* Tooltip description */}
                <div className="absolute top-16 left-1/2 -translate-x-1/2 hidden group-hover:block z-20">
                    <div className="px-3 py-2 text-xs text-white bg-gray-900 rounded shadow whitespace-nowrap">
                        {step.description}
                    </div>
                </div>
            </motion.div>

            {/* Connector */}
            {index < TASK_STATUS_FLOW.length - 1 && (
              <div className="mx-3 w-20 h-[4px] relative overflow-hidden">
                {index < activeIndex ? (
                  <div className="absolute inset-0 bg-gray-700" />
                ) : index === activeIndex ? (
                  <div className="absolute inset-0 text-[#636CCB] flow-line" />
                ) : (
                  <div className="absolute inset-0 bg-gray-300" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};