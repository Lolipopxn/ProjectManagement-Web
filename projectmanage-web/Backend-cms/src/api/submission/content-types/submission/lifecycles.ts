/**
 * Submission lifecycle hooks
 * Handles submission notifications
 */

export default {
  /**
   * Triggered after a submission is created
   * Sends notification email to project leader
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      strapi.log.info('📝 Submission created, notifying project leader...');

      // 1. ดึงข้อมูล Task
      const taskId = result.task_id_number;
      if (!taskId) {
        strapi.log.warn('Task ID not found in submission');
        return;
      }

      const task = await strapi.entityService.findOne(
        'api::task.task',
        taskId,
        {
          fields: ['id', 'task_name', 'description', 'project_id_number'],
        }
      );

      if (!task) {
        strapi.log.warn(`Task not found: ${taskId}`);
        return;
      }

      strapi.log.info(`📋 Task found: ${task.task_name}`);

      // 2. ดึงข้อมูล Project
      const projectId = task.project_id_number;
      if (!projectId) {
        strapi.log.warn('Project ID not found in task');
        return;
      }

      const project = await strapi.entityService.findOne(
        'api::project.project',
        projectId,
        {
          fields: ['id', 'project_name', 'description', 'created_by_user'],
        }
      );

      if (!project) {
        strapi.log.warn(`Project not found: ${projectId}`);
        return;
      }

      strapi.log.info(`📁 Project found: ${project.project_name}`);

      // 3. ดึงข้อมูล Project Leader
      const leaderId = project.created_by_user;
      if (!leaderId) {
        strapi.log.warn('Project leader not found');
        return;
      }

      const leader = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        leaderId,
        {
          fields: ['id', 'username', 'email'],
        }
      );

      if (!leader) {
        strapi.log.warn(`Leader not found: ${leaderId}`);
        return;
      }

      strapi.log.info(`👨‍💼 Leader found: ${leader.username}`);

      // 4. ดึงข้อมูลผู้ส่งงาน (Submitter)
      const submitterId = result.submitted_by_user_id_number;
      if (!submitterId) {
        strapi.log.warn('Submitter ID not found');
        return;
      }

      const submitter = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        submitterId,
        {
          fields: ['id', 'username', 'email'],
        }
      );

      if (!submitter) {
        strapi.log.warn(`Submitter not found: ${submitterId}`);
        return;
      }

      strapi.log.info(`👤 Submitter found: ${submitter.username}`);

      // 5. สร้าง Notification record สำหรับ Leader
      const notification = await strapi.entityService.create(
        'api::notification.notification',
        {
          data: {
            type: 'task_status_changed',
            title: `${submitter.username} submitted "${task.task_name}"`,
            message: `${submitter.username} has submitted their work for ${task.task_name}. Please review the submission.`,
            recipient: leader.id,
            sender: submitter.id,
            related_project: project.id,
            is_read: false,
            email_sent: false,
          },
        }
      );

      strapi.log.info(`📬 Notification created for leader: ID ${notification.id}`);

      // 6. ส่ง Email ไปหา Leader
      const emailService = strapi.service('api::notification.email');
      const emailSent = await emailService.sendSubmissionPendingEmail(
        leader,
        task,
        project,
        submitter
      );

      // 7. อัพเดทสถานะการส่ง Email
      if (emailSent) {
        await strapi.entityService.update(
          'api::notification.notification',
          notification.id,
          {
            data: {
              email_sent: true,
              email_sent_at: new Date(),
            },
          }
        );
        strapi.log.info(`✅ Submission pending notification sent to leader ${leader.email}`);
      }

    } catch (error) {
      strapi.log.error('❌ Error in submission afterCreate lifecycle:', error);
    }
  },

  /**
   * Triggered after a submission is updated
   * Sends notification email to member when approved
   */
  async afterUpdate(event) {
    const { result, params } = event;

    try {
      // ตรวจสอบว่ามีการเปลี่ยนสถานะเป็น approved หรือไม่
      // (สามารถเพิ่ม field status ใน schema ได้ หรือตรวจสอบจาก publishedAt)
      const wasPublished = params.data?.publishedAt !== undefined && result.publishedAt;
      
      if (!wasPublished) {
        strapi.log.info('Submission updated but not published/approved, skipping notification');
        return;
      }

      strapi.log.info('📝 Submission approved, notifying member...');

      // 1. ดึงข้อมูล Task
      const taskId = result.task_id_number;
      if (!taskId) {
        strapi.log.warn('Task ID not found in submission');
        return;
      }

      const task = await strapi.entityService.findOne(
        'api::task.task',
        taskId,
        {
          fields: ['id', 'task_name', 'description', 'project_id_number'],
        }
      );

      if (!task) {
        strapi.log.warn(`Task not found: ${taskId}`);
        return;
      }

      // 2. ดึงข้อมูล Project
      const projectId = task.project_id_number;
      if (!projectId) {
        strapi.log.warn('Project ID not found in task');
        return;
      }

      const project = await strapi.entityService.findOne(
        'api::project.project',
        projectId,
        {
          fields: ['id', 'project_name', 'description', 'created_by_user'],
        }
      );

      if (!project) {
        strapi.log.warn(`Project not found: ${projectId}`);
        return;
      }

      // 3. ดึงข้อมูล Project Leader
      const leaderId = project.created_by_user;
      const leader = leaderId ? await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        leaderId,
        {
          fields: ['id', 'username', 'email'],
        }
      ) : null;

      // 4. ดึงข้อมูลผู้ส่งงาน (Member)
      const memberId = result.submitted_by_user_id_number;
      if (!memberId) {
        strapi.log.warn('Member ID not found');
        return;
      }

      const member = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        memberId,
        {
          fields: ['id', 'username', 'email'],
        }
      );

      if (!member) {
        strapi.log.warn(`Member not found: ${memberId}`);
        return;
      }

      strapi.log.info(`👤 Member found: ${member.username}`);

      // 5. สร้าง Notification record สำหรับ Member
      const notification = await strapi.entityService.create(
        'api::notification.notification',
        {
          data: {
            type: 'task_status_changed',
            title: `Your submission for "${task.task_name}" has been approved`,
            message: `${leader?.username || 'Project Leader'} has approved your submission for ${task.task_name}.`,
            recipient: member.id,
            sender: leader?.id || null,
            related_project: project.id,
            is_read: false,
            email_sent: false,
          },
        }
      );

      strapi.log.info(`📬 Notification created for member: ID ${notification.id}`);

      // 6. ส่ง Email ไปหา Member
      const emailService = strapi.service('api::notification.email');
      const emailSent = await emailService.sendSubmissionApprovedEmail(
        member,
        task,
        project,
        leader || { username: 'Project Leader' }
      );

      // 7. อัพเดทสถานะการส่ง Email
      if (emailSent) {
        await strapi.entityService.update(
          'api::notification.notification',
          notification.id,
          {
            data: {
              email_sent: true,
              email_sent_at: new Date(),
            },
          }
        );
        strapi.log.info(`✅ Submission approved notification sent to member ${member.email}`);
      }

    } catch (error) {
      strapi.log.error('❌ Error in submission afterUpdate lifecycle:', error);
    }
  },
};
