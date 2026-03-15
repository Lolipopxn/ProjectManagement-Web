import { useState } from "react";
import axios from "axios";

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

interface Project {
  id: number;
  documentId?: string;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user_id: any;
  created_by_user: number;
  slug: string;
}

interface User {
  id: number;
  documentId?: string;
  username: string;
  email: string;
}

interface data {
    task: Task;
    user: User | null;
    project: Project;
    submissions: Submission[];
    taskDocumentId: string;
    projectId: number;
    setShowReviewModal: React.Dispatch<React.SetStateAction<boolean>>,
    reviewAction: 'approve' | 'reject' | null;
    setReviewAction: React.Dispatch<React.SetStateAction<'approve' | 'reject' | null>>;
    refreshTask?: () => Promise<void>;
    refreshSubmission?: () => Promise<void>;
}

export default function ApprovePopup(
{
    task,
    user,
    project,
    submissions,
    taskDocumentId,
    projectId,
    setShowReviewModal,
    reviewAction,
    setReviewAction,
    refreshTask,
    refreshSubmission,
}
:  data ) {

    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewComment, setReviewComment] = useState('');

      const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setReviewAction(null);
        setReviewComment('');
    };

    const handleReviewTask = async () => {
        if (!task?.documentId || !reviewAction || !user) return;
    
        try {
          setReviewLoading(true);
          
          const newStatus = reviewAction === 'approve' ? 'completed' : 'rejected';
          
          try {
            const activeSubmissions = submissions.filter(( s:any ) => s.is_active && s.task_document_id === taskDocumentId);
            
            if (activeSubmissions.length > 0) {

              for (const submission of activeSubmissions) {
                if (submission.documentId) {
                  await axios.put(`/api/submissions/${submission.documentId}`, {
                    comments: reviewComment.trim() || null,
                    review_status: reviewAction === 'approve' ? 'approved' : 'rejected',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by_user_id: user.id
                  });
                }
              }
              

              await new Promise(resolve => setTimeout(resolve, 300));
            } else {
              await axios.post('/api/submissions', {
                task_document_id: taskDocumentId,
                task_id_number: task.id,
                comments: reviewComment.trim() || null,
                submission_description: '',
                file_urls: [],
                submitted_by_user_id_number: task.assigned_to_user_ids_number,
                is_active: true,
                review_status: reviewAction === 'approve' ? 'approved' : 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by_user_id: user.id
              });
              
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (submissionError) {
            console.error('Error updating review comment in submission:', submissionError);
          }
          
          const response = await axios.put(`/api/tasks/updateStatus`, {
            documentId: task.documentId,
            task_status: newStatus,
            note: reviewAction === 'approve' ? 'อนุมัติงาน' : 'ไม่อนุมัติงาน',
          });
    
          if (response.data.success) {
            try {
              if (task.assigned_to_user_ids_number && project?.id) {
                const notificationTitle = reviewAction === 'approve' 
                  ? `✅ งาน "${task.task_name}" ได้รับการอนุมัติ`
                  : `❌ งาน "${task.task_name}" ไม่ได้รับการอนุมัติ`;
                
                const notificationMessage = reviewAction === 'approve'
                  ? `งานของคุณได้รับการอนุมัติจาก Leader แล้ว${reviewComment.trim() ? `\n\nความคิดเห็น: ${reviewComment.trim()}` : ''}`
                  : `งานของคุณไม่ได้รับการอนุมัติ กรุณาแก้ไขและส่งใหม่${reviewComment.trim() ? `\n\nเหตุผล: ${reviewComment.trim()}` : ''}`;
    
                await axios.post('/api/notifications', {
                  type: 'task_status_changed',
                  title: notificationTitle,
                  message: notificationMessage,
                  recipient: task.assigned_to_user_ids_number,
                  sender: user.id,
                  related_project: project.id,
                  related_task: task.id,
                  link: `/main_pages/projects/${projectId}/tasks/${taskDocumentId}`
                });
              }
            } catch (notifError) {
              console.error('Error sending notification:', notifError);
            }
            
            // Close modal first
            setShowReviewModal(false);
            setReviewAction(null);
            setReviewComment('');
            
            // Refresh all data
            await new Promise(resolve => setTimeout(resolve, 100));
            refreshTask?.();
            refreshSubmission?.();

          } else {
          }
        } catch (error: any) {
          console.error('Error reviewing task:', error);
        } finally {
          setReviewLoading(false);
        }
      };

  return (
    <div className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3
            className={`text-lg font-semibold flex items-center space-x-2 ${
              reviewAction === "approve" ? "text-green-600" : "text-red-600"
            }`}
          >
            {reviewAction === "approve" ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span>
              {reviewAction === "approve" ? "อนุมัติงาน" : "ไม่อนุมัติงาน"}
            </span>
          </h3>
          <button
            onClick={handleCloseReviewModal}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={reviewLoading}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div
            className={`border rounded-lg p-4 mb-4 ${
              reviewAction === "approve"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p
              className={`text-sm ${
                reviewAction === "approve" ? "text-green-800" : "text-red-800"
              }`}
            >
              <strong>Task:</strong> {task.task_name}
            </p>
            <p
              className={`text-sm mt-1 ${
                reviewAction === "approve" ? "text-green-700" : "text-red-700"
              }`}
            >
              คุณกำลังจะ{reviewAction === "approve" ? "อนุมัติ" : "ไม่อนุมัติ"}
              งานนี้
            </p>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between dark:text-gray-300">
              <span>
                ความคิดเห็น{" "}
                {reviewAction === "reject" && (
                  <span className="text-red-500">*</span>
                )}
              </span>
              <span className="text-xs text-gray-500 font-normal dark:text-gray-400">
                {reviewComment.length} / 1000 ตัวอักษร
              </span>
            </label>
            <div className="relative">
              <textarea
                value={reviewComment}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setReviewComment(e.target.value);
                  }
                }}
                rows={6}
                maxLength={1000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-y min-h-[120px] max-h-[300px]"
                placeholder={
                  reviewAction === "approve"
                    ? "เขียนความคิดเห็นเพิ่มเติม เช่น จุดเด่น ข้อควรปรับปรุง คำแนะนำ (ไม่บังคับ)"
                    : "กรุณาระบุเหตุผลที่ไม่อนุมัติ เช่น งานไม่ตรงตามที่กำหนด, คุณภาพไม่เป็นไปตามมาตรฐาน, ต้องการแก้ไขส่วนใด (บังคับ)"
                }
                disabled={reviewLoading}
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              />
              {reviewComment.length >= 950 && (
                <div className="absolute bottom-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                  เหลืออีก {1000 - reviewComment.length} ตัวอักษร
                </div>
              )}
            </div>
            <div className="mt-2 flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                ความคิดเห็นของคุณจะถูกบันทึกในประวัติการส่งงานและสมาชิกที่เกี่ยวข้องจะได้รับการแจ้งเตือน
              </span>
            </div>
          </div>

          {reviewAction === "reject" && !reviewComment.trim() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                กรุณาระบุเหตุผลในการไม่อนุมัติ
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCloseReviewModal}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-all dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            disabled={reviewLoading}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleReviewTask}
            disabled={
              reviewLoading ||
              (reviewAction === "reject" && !reviewComment.trim())
            }
            className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
              reviewAction === "approve"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {reviewLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              <>
                {reviewAction === "approve" ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <span>
                  {reviewAction === "approve" ? "อนุมัติ" : "ไม่อนุมัติ"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
