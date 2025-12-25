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

  /**
   * Triggered after a task is updated
   * Sends notification email to member when task status changes to completed
   */
  async afterUpdate(event) {
    const { result } = event;

    try {
      strapi.log.info('🔄 Task updated, checking status change...');
      strapi.log.info(`Task ID: ${result.id}, New Status: ${result.task_status}`);
      
      // ตรวจสอบว่า status ปัจจุบันเป็นอะไร
      const currentStatus = result.task_status?.toLowerCase().trim();
      
      // ========================
      // HANDLE REJECTION
      // ========================
      if (currentStatus === 'rejected') {
        strapi.log.info('🚫 Task rejected, checking if notification already sent...');

        // ตรวจสอบว่าเคยส่ง rejection notification ไปแล้วหรือยัง
        const existingRejectionNotifications = await strapi.entityService.findMany(
          'api::notification.notification',
          {
            filters: {
              type: 'task_status_changed',
              related_project: result.project_id_number,
              $and: [
                {
                  message: {
                    $contains: result.task_name,
                  },
                },
                {
                  message: {
                    $contains: 'rejected',
                  },
                },
              ],
            },
            limit: 1,
          }
        );

        if (existingRejectionNotifications && existingRejectionNotifications.length > 0) {
          strapi.log.info('Rejection notification already sent for this task, skipping');
          return;
        }

        strapi.log.info('🚫 Task rejected and notification not sent yet, notifying member...');

        // 1. ดึงข้อมูลผู้ที่ถูกมอบหมาย (assigned user)
        const assignedUserId = result.assigned_to_user_ids_number;
        if (!assignedUserId) {
          strapi.log.info('No user assigned to this task, skipping notification');
          return;
        }

        const member = await strapi.entityService.findOne(
          'plugin::users-permissions.user',
          assignedUserId,
          {
            fields: ['id', 'username', 'email'],
          }
        );

        if (!member) {
          strapi.log.warn(`Assigned user not found: ${assignedUserId}`);
          return;
        }

        strapi.log.info(`👤 Member found: ${member.username} (${member.email})`);

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
        const leader = leaderId ? await strapi.entityService.findOne(
          'plugin::users-permissions.user',
          leaderId,
          {
            fields: ['id', 'username', 'email'],
          }
        ) : null;

        strapi.log.info(`👨‍💼 Leader found: ${leader?.username || 'Unknown'}`);

        // 4. รอสักครู่เพื่อให้ frontend อัปเดต comment ใน submission ก่อน
        await new Promise(resolve => setTimeout(resolve, 500));

        // 5. ดึง submission ล่าสุดของ task นี้เพื่อเอา comment
        let rejectionReason = null;
        const latestSubmission = await strapi.entityService.findMany(
          'api::submission.submission',
          {
            filters: {
              task_id_number: result.id,
              is_active: true, // ดึงแค่ submission ที่ active
            },
            fields: ['id', 'comments', 'submission_description', 'createdAt', 'updatedAt'],
            sort: { updatedAt: 'desc' }, // เรียงตาม updatedAt แทน createdAt
            limit: 1,
          }
        );

        if (latestSubmission && latestSubmission.length > 0) {
          rejectionReason = latestSubmission[0].comments;
          strapi.log.info(`📝 Submission found - ID: ${latestSubmission[0].id}`);
          strapi.log.info(`📝 Comments field value: "${rejectionReason || '(empty)'}"`);
          strapi.log.info(`📝 Updated at: ${latestSubmission[0].updatedAt}`);
        } else {
          strapi.log.warn('⚠️ No active submission found for this task');
        }

        strapi.log.info(`🔴 Final rejection reason to send: "${rejectionReason || 'No specific reason provided.'}"`);

        // 6. สร้าง Notification record สำหรับ Member
        const notification = await strapi.entityService.create(
          'api::notification.notification',
          {
            data: {
              type: 'task_status_changed',
              title: `Your submission for "${result.task_name}" needs revision`,
              message: `${leader?.username || 'Project Leader'} has requested revisions for your work on ${result.task_name}.${rejectionReason ? ` Feedback: ${rejectionReason}` : ''}`,
              recipient: member.id,
              sender: leader?.id || null,
              related_project: project.id,
              is_read: false,
              email_sent: false,
            },
          }
        );

        strapi.log.info(`📬 Rejection notification created for member: ID ${notification.id}`);

        // 6. ส่ง Email ไปหา Member
        const emailService = strapi.service('api::notification.email');
        const emailSent = await emailService.sendSubmissionRejectedEmail(
          member,
          result,
          project,
          leader || { username: 'Project Leader' },
          rejectionReason
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
          strapi.log.info(`✅ Task rejection notification sent to member ${member.email}`);
        }

        return; // Exit early after handling rejection
      }

      // ========================
      // HANDLE APPROVAL (Completed)
      // ========================
      if (currentStatus !== 'completed') {
        strapi.log.info(`Status is "${currentStatus}", not "completed" or "rejected", skipping notification`);
        return;
      }

      // ดึงข้อมูล task เดิมจากฐานข้อมูลเพื่อตรวจสอบว่าเปลี่ยนสถานะจริงหรือไม่
      // โดยการตรวจสอบว่าเคยส่ง notification สำหรับการอนุมัติไปแล้วหรือยัง
      const existingNotifications = await strapi.entityService.findMany(
        'api::notification.notification',
        {
          filters: {
            type: 'task_status_changed',
            related_project: result.project_id_number,
            $and: [
              {
                message: {
                  $contains: result.task_name,
                },
              },
              {
                message: {
                  $contains: 'approved',
                },
              },
            ],
          },
          limit: 1,
        }
      );

      if (existingNotifications && existingNotifications.length > 0) {
        strapi.log.info('Approval notification already sent for this task, skipping');
        return;
      }

      strapi.log.info('✅ Task status is completed and notification not sent yet, notifying member...');

      // 1. ดึงข้อมูลผู้ที่ถูกมอบหมาย (assigned user)
      const assignedUserId = result.assigned_to_user_ids_number;
      if (!assignedUserId) {
        strapi.log.info('No user assigned to this task, skipping notification');
        return;
      }

      const member = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        assignedUserId,
        {
          fields: ['id', 'username', 'email'],
        }
      );

      if (!member) {
        strapi.log.warn(`Assigned user not found: ${assignedUserId}`);
        return;
      }

      strapi.log.info(`👤 Member found: ${member.username} (${member.email})`);

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
      const leader = leaderId ? await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        leaderId,
        {
          fields: ['id', 'username', 'email'],
        }
      ) : null;

      strapi.log.info(`👨‍💼 Leader found: ${leader?.username || 'Unknown'}`);

      // 4. สร้าง Notification record สำหรับ Member
      const notification = await strapi.entityService.create(
        'api::notification.notification',
        {
          data: {
            type: 'task_status_changed',
            title: `Your task "${result.task_name}" has been approved`,
            message: `${leader?.username || 'Project Leader'} has approved your work for ${result.task_name}.`,
            recipient: member.id,
            sender: leader?.id || null,
            related_project: project.id,
            is_read: false,
            email_sent: false,
          },
        }
      );

      strapi.log.info(`📬 Notification created for member: ID ${notification.id}`);

      // 5. ส่ง Email ไปหา Member
      const emailService = strapi.service('api::notification.email');
      const emailSent = await emailService.sendSubmissionApprovedEmail(
        member,
        result,
        project,
        leader || { username: 'Project Leader' }
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
        strapi.log.info(`✅ Task completed notification sent to member ${member.email}`);
      }

    } catch (error) {
      strapi.log.error('❌ Error in task afterUpdate lifecycle:', error);
    }
  },
};
