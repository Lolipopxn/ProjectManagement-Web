'use client';

import { IoMdClose } from 'react-icons/io';
import { CgProfile } from 'react-icons/cg';

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

export default function AssignUserModal({
  isOpen,
  onClose,
  projectMembers,
  assignedUserIds,
  onAssign,
  refreshTaskMembers,
  loadingUserId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectMembers: ProjectMember[];
  assignedUserIds: number[];
  onAssign: (userId: number) => void;
  refreshTaskMembers: boolean;
  loadingUserId: number | null;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 space-y-4">
        {/* header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">
            เพิ่มผู้มีส่วนร่วมในงาน
          </h2>
          <button onClick={onClose}>
            <IoMdClose className="size-6" />
          </button>
        </div>

        {/* list */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {projectMembers.map((member) => {
            const isAssigned = assignedUserIds.includes(
              member.userInfo?.id ? member.userInfo.id : -1
            );

            const isLoading = loadingUserId === member.userInfo?.id;

            return (
              <div
                key={member.id}
                className={`flex items-center justify-between border rounded-lg p-3 ${
                  isAssigned
                    ? 'bg-gray-100 opacity-60'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CgProfile className="size-6" />
                  <div>
                    <div className="font-medium">
                      {member.userInfo?.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.userInfo?.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* role badge */}
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      member.role_in_project === 'Leader'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {member.role_in_project === 'Leader'
                      ? 'หัวหน้า'
                      : 'สมาชิก'}
                  </span>

                  {/* action */}
                  <button
                    disabled={isAssigned || isLoading}
                    onClick={() => onAssign(member.userInfo!.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
                        isAssigned || isLoading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-[#50589C] text-white hover:bg-[#50589C]/90'
                    }`}
                    >
                    {isLoading ? (
                        <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        กำลังเพิ่ม...
                        </>
                    ) : isAssigned ? (
                        'เพิ่มแล้ว'
                    ) : (
                        'เพิ่ม'
                    )}
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}