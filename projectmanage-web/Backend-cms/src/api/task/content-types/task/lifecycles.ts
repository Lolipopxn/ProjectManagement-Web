/**
 * Task lifecycle hooks
 * Handles task assignment notifications
 */

export default {
  /**
   * Triggered after a task is created
   * Sends notification email to assigned user
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      strapi.log.info('📋 Task created, checking for assignment...');

      // ตรวจสอบว่ามีการมอบหมายผู้ใช้หรือไม่
      if (!result.assigned_to_user_ids_number) {
        strapi.log.info('No user assigned to this task, skipping notification');
        return;
      }

      const assignedUserId = result.assigned_to_user_ids_number;
      strapi.log.info(`🎯 Task assigned to user ID: ${assignedUserId}`);

      // 1. ดึงข้อมูลผู้ใช้ที่ถูกมอบหมาย
      const recipient = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        assignedUserId,
        {
          fields: ['id', 'username', 'email'],
        }
      );

      if (!recipient) {
        strapi.log.warn(`Recipient user not found: ${assignedUserId}`);
        return;
      }

      strapi.log.info(`👤 Recipient found: ${recipient.username} (${recipient.email})`);

      // 2. ดึงข้อมูล Project
      const projectId = result.project_id_number;
      if (!projectId) {
        strapi.log.warn('Project ID not found in task');
        return;
      }

      const project = await strapi.entityService.findOne(
        'api::project.project',
        projectId,
        {
          fields: ['id', 'project_name', 'description', 'start_date', 'end_date', 'created_by_user'],
        }
      );

      if (!project) {
        strapi.log.warn(`Project not found: ${projectId}`);
        return;
      }

      strapi.log.info(`📁 Project found: ${project.project_name}`);

      // 3. ดึงข้อมูลผู้สร้าง Task (Assigner)
      // ใช้ createdBy จาก event หรือ created_by_user_id ของ project
      let assignerId = null;
      
      // ลองหาจาก createdBy ของ task
      if (event.params?.data?.createdBy) {
        assignerId = event.params.data.createdBy;
      } else if (result.createdBy?.id) {
        assignerId = result.createdBy.id;
      } else if (project.created_by_user) {
        // ถ้าไม่มี ให้ใช้ project leader แทน
        assignerId = project.created_by_user;
      }

      let assigner = null;
      if (assignerId) {
        assigner = await strapi.entityService.findOne(
          'plugin::users-permissions.user',
          assignerId,
          {
            fields: ['id', 'username', 'email'],
          }
        );
        strapi.log.info(`👨‍💼 Assigner found: ${assigner?.username || 'Unknown'}`);
      }

      // ถ้าไม่มีข้อมูล assigner ให้ใช้ข้อมูลเริ่มต้น
      if (!assigner) {
        assigner = {
          username: 'Project Team',
          email: null,
        };
      }

      // 4. สร้าง Notification record
      const notification = await strapi.entityService.create(
        'api::notification.notification',
        {
          data: {
            type: 'task_assigned',
            title: `You've been assigned to "${result.task_name}"`,
            message: `${assigner.username} has assigned you to a task in ${project.project_name}`,
            recipient: recipient.id,
            sender: assigner.id || null,
            related_project: project.id,
            is_read: false,
            email_sent: false,
          },
        }
      );

      strapi.log.info(`📬 Notification created: ID ${notification.id}`);

      // 5. ส่ง Email
      const emailService = strapi.service('api::notification.email');
      const emailSent = await emailService.sendTaskAssignmentEmail(
        recipient,
        result,
        project,
        assigner
      );

      // 6. อัพเดทสถานะการส่ง Email
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
        strapi.log.info(`✅ Task assignment notification sent successfully to ${recipient.email}`);
      }

    } catch (error) {
      strapi.log.error('❌ Error in task afterCreate lifecycle:', error);
    }
  },
};
