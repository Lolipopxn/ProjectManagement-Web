import { IoMdClose } from "react-icons/io";

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

interface props {
    toggleMember: boolean;
    setToggleMember: React.Dispatch<React.SetStateAction<boolean>>;
    projectMembers: ProjectMember[];
    refreshProjectMembers: () => Promise<void>;
    membersLoading: boolean;
    setShowAddMemberModal: React.Dispatch<React.SetStateAction<boolean>>;
    userRole: string;
    removeMemberLoading: string | number | null;
    formatDate: (dateString : string) => string;
    handleRemoveMember: (member: ProjectMember, memberName: string) => void;
}

export default function MemberPopup(
    {
        toggleMember, 
        setToggleMember, 
        projectMembers,
        refreshProjectMembers,
        membersLoading,
        setShowAddMemberModal,
        userRole,
        removeMemberLoading,
        formatDate,
        handleRemoveMember

    } : props) {
        
  return (
    <div
      className={`${
        toggleMember
          ? "fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6"
          : "hidden "
      }`}
    >
      {/* Members */}
      <div className="bg-white rounded-lg shadow-sm py-6 px-8 space-y-3 scale-80 md:scale-100 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">สมาชิกทีม</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">จัดการสมาชิกในโปรเจ็กต์</p>
            </div>
          </div>
          <div>
            <button onClick={() => setToggleMember(!toggleMember)}>
              <IoMdClose className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-3">
          <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm px-3 py-2 rounded-full font-medium border border-blue-300">
            {projectMembers.length} สมาชิก
          </span>
          <button
            onClick={refreshProjectMembers}
            disabled={membersLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="รีเฟรชข้อมูลสมาชิก"
          >
            <svg
              className={`w-4 h-4 text-gray-600 ${
                membersLoading ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          {userRole === "Leader" && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              <span>เพิ่มสมาชิก</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {membersLoading ? (
            <div className="text-center text-gray-500 py-12">
              <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mb-4"></div>
              <p className="text-base font-medium">กำลังโหลดข้อมูลสมาชิก</p>
              <p className="text-sm text-gray-400">กรุณารอสักครู่...</p>
            </div>
          ) : projectMembers.length > 0 ? (
            projectMembers.map((member) => {
              const getRoleColor = (role: string) => {
                switch (role.toLowerCase()) {
                  case "leader":
                    return "bg-purple-100 text-purple-800 border-purple-200";
                  case "manager":
                    return "bg-blue-100 text-blue-800 border-blue-200";
                  case "developer":
                    return "bg-green-100 text-green-800 border-green-200";
                  default:
                    return "bg-gray-100 text-gray-800 border-gray-200";
                }
              };

              const getAvatarColor = (role: string) => {
                switch (role.toLowerCase()) {
                  case "leader":
                    return "bg-gradient-to-br from-purple-400 to-purple-600";
                  case "manager":
                    return "bg-gradient-to-br from-blue-400 to-blue-600";
                  case "developer":
                    return "bg-gradient-to-br from-green-400 to-green-600";
                  default:
                    return "bg-gradient-to-br from-gray-400 to-gray-600";
                }
              };

              const isRemoving =
                removeMemberLoading ===
                (member.userInfo?.documentId ||
                  member.userInfo?.id ||
                  member.user_id_in_project);

              return (
                <div
                  key={member.id}
                  className="group bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-3 transition-all duration-200 hover:shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:border-gray-500"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 ${getAvatarColor(
                        member.role_in_project
                      )} rounded-full flex items-center justify-center text-white text-sm font-semibold`}
                    >
                      {(
                        member.userInfo?.username ||
                        `User ${member.user_id_in_project}`
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm truncate dark:text-gray-100">
                          {member.userInfo?.username ||
                            `User ${member.user_id_in_project}`}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(
                            member.role_in_project
                          )}`}
                        >
                          {member.role_in_project}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(member.join_date)}</span>
                        {member.userInfo?.email && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-20">
                              {member.userInfo.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {userRole === "Leader" && (
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member,
                              member.userInfo?.username ||
                                `User ${member.user_id_in_project}`
                            )
                          }
                          disabled={isRemoving}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-red-50"
                          title="ลบสมาชิกออกจากโปรเจ็กต์"
                        >
                          {isRemoving ? (
                            <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                          ) : (
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  ยังไม่มีสมาชิกในโปรเจ็กต์
                </h3>
                <p className="text-sm text-gray-500 mb-4 max-w-sm">
                  เริ่มต้นโดยการเพิ่มสมาชิกเข้ามาร่วมงานในโปรเจ็กต์นี้
                </p>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <span>เพิ่มสมาชิกแรก</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
