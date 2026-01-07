// taskStatusFlow.ts
export interface TaskStatusStep {
  key: string;
  label: string;
  description: string;
}

export const TASK_STATUS_FLOW = [
  {
    key: 'begin',
    label: 'เริ่มต้น',
    description: 'สร้างงานสำเร็จ',
  },
  {
    key: 'not turn in',
    label: 'ยังไม่ส่ง',
    description: 'ยังไม่มีการเริ่มงาน',
  },
  {
    key: 'continue',
    label: 'กำลังดำเนินการ',
    description: 'งานกำลังดำเนินการอยู่',
  },
  {
    key: 'pending_review',
    label: 'รอตรวจสอบ',
    description: 'รอหัวหน้าโปรเจคหรือคนที่มีสิทธ์มาอนุมัติ',
  },
  {
    key: 'final',
    label: '',
    description: 'งานนี้เสร็จเเล้วหรือไม่ ?',
  },
];