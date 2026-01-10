// Task Status Color Configuration
// ไฟล์นี้จัดการสีสถานะ task ให้สอดคล้องกันทั่วทั้งระบบ

export interface TaskStatusConfig {
  text: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeColor: string;
  indicatorColor: string;
  lightBgColor: string;
  statusText: string;
  description: string;
  descriptionColor: string;
  iconBg: string;
}

export const getTaskStatusConfig = (status: string): TaskStatusConfig => {
  switch (status.toLowerCase()) {
    case 'completed':
      return {
        text: 'เสร็จแล้ว',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
        badgeColor: 'bg-green-500',
        indicatorColor: 'bg-green-500',
        lightBgColor: 'bg-green-100',
        statusText: 'สำเร็จ',
        description: 'งานได้รับการอนุมัติแล้ว',
        descriptionColor: 'text-green-600',
        iconBg: 'bg-green-200'
      };
    
    case 'pending_review':
    case 'turn in':
      return {
        text: 'รอตรวจสอบ',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300',
        badgeColor: 'bg-blue-500',
        indicatorColor: 'bg-blue-500',
        lightBgColor: 'bg-blue-100',
        statusText: 'รอตรวจสอบ',
        description: 'งานถูกส่งแล้ว กำลังรอการตรวจสอบจาก Leader',
        descriptionColor: 'text-blue-600',
        iconBg: 'bg-blue-200'
      };
    
    case 'rejected':
      return {
        text: 'ไม่ผ่าน',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        badgeColor: 'bg-red-500',
        indicatorColor: 'bg-red-500',
        lightBgColor: 'bg-red-100',
        statusText: 'ไม่ผ่าน',
        description: 'งานไม่ผ่านการตรวจสอบ กรุณาแก้ไขและส่งใหม่',
        descriptionColor: 'text-red-600',
        iconBg: 'bg-red-200'
      };
    
    case 'not turn in':
    case 'pending':
      return {
        text: 'ยังไม่ส่ง',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300',
        badgeColor: 'bg-yellow-500',
        indicatorColor: 'bg-yellow-500',
        lightBgColor: 'bg-yellow-100',
        statusText: 'รอส่งงาน',
        description: 'ยังไม่ได้ส่งงาน กรุณาส่งก่อนครบกำหนด',
        descriptionColor: 'text-yellow-600',
        iconBg: 'bg-yellow-200'
      };
    
    case 'overdue':
      return {
        text: 'เลยกำหนด',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        badgeColor: 'bg-red-600',
        indicatorColor: 'bg-red-600',
        lightBgColor: 'bg-red-100',
        statusText: 'เลยกำหนด',
        description: 'เลยเวลาส่งงานแล้ว',
        descriptionColor: 'text-red-600',
        iconBg: 'bg-red-200'
      };

      case 'continue':
      return {
        text: 'กำลังดำเนินการ',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300',
        badgeColor: 'bg-blue-500',
        indicatorColor: 'bg-blue-500',
        lightBgColor: 'bg-blue-100',
        statusText: 'กำลังดำเนินการ',
        description: 'งานอยู่ระหว่างการดำเนินการ',
        descriptionColor: 'text-blue-600',
        iconBg: 'bg-blue-200'
      };
    
    default:
      return {
        text: 'ไม่ระบุ',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300',
        badgeColor: 'bg-gray-400',
        indicatorColor: 'bg-gray-400',
        lightBgColor: 'bg-gray-100',
        statusText: 'ไม่ระบุสถานะ',
        description: 'สถานะไม่ชัดเจน',
        descriptionColor: 'text-gray-600',
        iconBg: 'bg-gray-200'
      };
  }
};

// Color configurations for different column types in dashboard
export const getColumnTypeColors = (columnType: 'overdue' | 'urgent' | 'normal' | 'pending_review' | 'rejected' | 'completed') => {
  switch (columnType) {
    case 'overdue':
      return {
        statusIndicatorColor: 'bg-red-600',
        countdownStyle: 'bg-red-100 text-red-700'
      };
    case 'urgent':
      return {
        statusIndicatorColor: 'bg-orange-500',
        countdownStyle: 'bg-orange-100 text-orange-700'
      };
    case 'normal':
      return {
        statusIndicatorColor: 'bg-yellow-500',
        countdownStyle: 'bg-yellow-100 text-yellow-700'
      };
    case 'pending_review':
      return {
        statusIndicatorColor: 'bg-blue-500',
        countdownStyle: 'bg-blue-100 text-blue-700'
      };
    case 'rejected':
      return {
        statusIndicatorColor: 'bg-red-500',
        countdownStyle: 'bg-red-100 text-red-700'
      };
    case 'completed':
      return {
        statusIndicatorColor: 'bg-green-500',
        countdownStyle: 'bg-green-100 text-green-700'
      };
    default:
      return {
        statusIndicatorColor: 'bg-gray-400',
        countdownStyle: 'bg-gray-100 text-gray-700'
      };
  }
};
