import React from 'react';

interface TaskStatusIconProps {
  status: string;
  className?: string;
}

export const TaskStatusIcon: React.FC<TaskStatusIconProps> = ({ status, className = "w-6 h-6" }) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return (
        <svg className={`${className} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    
    case 'pending_review':
    case 'turn in':
      return (
        <svg className={`${className} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    
    case 'rejected':
      return (
        <svg className={`${className} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    
    case 'not turn in':
    case 'pending':
      return (
        <svg className={`${className} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    
    case 'overdue':
      return (
        <svg className={`${className} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );

    case 'begin':
    return (
      <svg className={`${className} text-gray-500`} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="9" />
      </svg>
    );

    case 'continue':
    return (
      <svg className={`${className} text-cyan-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
        <path strokeLinejoin="round" strokeWidth={2} d="M10 8l6 4-6 4V8z"/>
      </svg>
    );

    case 'final':
    return (
      <svg className={`${className} text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
      
    default:
      return (
        <svg className={`${className} text-gray-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// Additional smaller icon variant for compact displays
export const TaskStatusIconSmall: React.FC<TaskStatusIconProps> = ({ status, className = "w-4 h-4" }) => {
  return <TaskStatusIcon status={status} className={className} />;
};

export default TaskStatusIcon;
