interface Project {
  id: number;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user_id: any; // อาจเป็น ID หรือ User object จาก relation
  created_by_user: number; // ID ของผู้สร้าง
  created_by_user_info?: any; // ข้อมูลผู้สร้างโปรเจ็กต์
  userRole?: string; // บทบาทของผู้ใช้ในโปรเจ็กต์
}

interface ProjectCardProps {
  project: Project;
  status?: 'active' | 'completed';
}

export default function ProjectCard({ project, status }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // ใช้ project_status จาก Strapi แทน status prop
  const projectStatus = project.project_status || 'pending';
  
  // ดึงข้อมูลผู้สร้างโปรเจ็กต์
  const getCreatedByUser = () => {
    // ใช้ข้อมูลจาก created_by_user_info ก่อน (ข้อมูลที่ API ดึงมาให้)
    if (project.created_by_user_info) {
      return {
        id: project.created_by_user_info.id,
        username: project.created_by_user_info.username,
        email: project.created_by_user_info.email || ''
      };
    }
    
    // Fallback: ตรวจสอบ created_by_user_id relation
    if (project.created_by_user_id) {
      // ถ้าเป็น object (มาจาก populate)
      if (typeof project.created_by_user_id === 'object' && project.created_by_user_id.username) {
        return {
          id: project.created_by_user_id.id,
          username: project.created_by_user_id.username,
          email: project.created_by_user_id.email || ''
        };
      }
      // ถ้าเป็น ID เปล่า
      return {
        id: project.created_by_user_id,
        username: `User ID: ${project.created_by_user_id}`,
        email: ''
      };
    }
    
    // Fallback: ใช้ created_by_user field
    if (project.created_by_user) {
      return {
        id: project.created_by_user,
        username: `User ID: ${project.created_by_user}`,
        email: ''
      };
    }
    
    return {
      id: null,
      username: 'ไม่ระบุผู้สร้าง',
      email: ''
    };
  };

  const createdByUser = getCreatedByUser();
  
  // ฟังก์ชันแปลงชื่อบทบาทให้เป็นภาษาไทย
  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'leader':
      case 'หัวหน้า':
        return 'หัวหน้าโปรเจ็กต์';
      case 'member':
      case 'สมาชิก':
        return 'สมาชิก';
      case 'developer':
        return 'นักพัฒนา';
      case 'designer':
        return 'นักออกแบบ';
      case 'tester':
        return 'นักทดสอบ';
      case 'manager':
        return 'ผู้จัดการ';
      default:
        return role;
    }
  };
  
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in-progress':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          title: 'โปรเจ็กต์ที่กำลังดำเนินการ',
          statusText: 'กำลังดำเนินการ',
          statusBg: 'bg-green-100 text-green-800'
        };
      case 'completed':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200', 
          titleColor: 'text-blue-800',
          title: 'โปรเจ็กต์ที่เสร็จสิ้นแล้ว',
          statusText: 'เสร็จสิ้น',
          statusBg: 'bg-blue-100 text-blue-800'
        };
      case 'pending':
      case 'planning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-800',
          title: 'โปรเจ็กต์ที่รอดำเนินการ',
          statusText: 'รอดำเนินการ',
          statusBg: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-800',
          title: 'โปรเจ็กต์',
          statusText: 'ไม่ระบุสถานะ',
          statusBg: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const statusConfig = getStatusConfig(projectStatus);

  return (
    <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2 rounded-lg p-6 mb-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${statusConfig.titleColor} font-semibold text-lg`}>
          {statusConfig.title}
        </h3>
      </div>

      {/* Project Content */}
      <div className="space-y-4">
        {/* Project Name และ Created By */}
        <div className="space-y-2">
          <h4 className="text-xl font-bold text-gray-900">
            {project.project_name}
          </h4>
          
          {/* Created By User - แสดงชัดเจนขึ้น */}
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium">สร้างโดย: {createdByUser.username}</span>
          </div>

          {/* User Role in Project - แสดงบทบาทของผู้ใช้ */}
          {project.userRole && (
            <div className="flex items-center space-x-2 text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">บทบาท: {getRoleDisplayName(project.userRole)}</span>
            </div>
          )}
        </div>

        {/* Project Description */}
        {project.description && (
          <p className="text-gray-600 text-sm">
            {project.description}
          </p>
        )}

        {/* Project Info */}
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-semibold">
              {createdByUser.username.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            {/* Status */}
            <div className="mb-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusConfig.statusBg}`}>
                {statusConfig.statusText}
              </span>
            </div>

            {/* Date Range */}
            <div className="text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {formatDate(project.start_date)} - {formatDate(project.end_date)}
                </span>
              </div>
            </div>

            {/* Project ID */}
            <div className="text-gray-500 text-xs mt-1">
              Project ID: {project.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
