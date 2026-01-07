/**
 * Cron configuration
 * https://docs.strapi.io/dev-docs/configurations/cron
 */

export default {
  /**
   * Task due date reminder - Runs every day at 9:00 AM
   * Checks for tasks due in 1, 3, or 7 days and sends reminder emails
   */
  taskDueDateReminder: {
    task: async ({ strapi }) => {
      try {
        strapi.log.info('🕒 Running task due date reminder cron job...');
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // กำหนดวันที่ต้องการตรวจสอบ (1, 3, 7 วันข้างหน้า)
        const reminderDays = [1, 3, 7];
        
        for (const days of reminderDays) {
          await checkAndSendReminders(strapi, today, days);
        }
        
        strapi.log.info('✅ Task due date reminder cron job completed');
      } catch (error) {
        strapi.log.error('❌ Error in task due date reminder cron job:', error);
      }
    },
    options: {
      rule: '0 9 * * *', // ทุกวันเวลา 09:00 น.
      tz: 'Asia/Bangkok', // เขตเวลาประเทศไทย
    },
  },
};

/**
 * Check tasks due in specific number of days and send reminders
 */
async function checkAndSendReminders(strapi: any, today: Date, daysAhead: number) {
  try {
    // คำนวณวันที่ที่จะตรวจสอบ
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);
    
    // เริ่มต้นและสิ้นสุดของวัน (00:00:00 - 23:59:59)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    strapi.log.info(`🔍 Checking tasks due in ${daysAhead} days (${targetDate.toDateString()})...`);
    
    // ค้นหา tasks ที่ครบกำหนดในวันที่กำหนด และยังไม่เสร็จ
    const tasks = await strapi.entityService.findMany('api::task.task', {
      filters: {
        due_date: {
          $gte: startOfDay.toISOString(),
          $lte: endOfDay.toISOString(),
        },
        task_status: {
          $notIn: ['completed', 'cancelled'],
        },
        assigned_to_user_ids_number: {
          $notNull: true,
        },
      },
    });
    
    if (!tasks || tasks.length === 0) {
      strapi.log.info(`ℹ️ No tasks found due in ${daysAhead} days`);
      return;
    }
    
    strapi.log.info(`📋 Found ${tasks.length} task(s) due in ${daysAhead} days`);
    
    // ป้องกันการส่งซ้ำ - เก็บ tracking ไว้ใน database
    const emailService = strapi.service('api::notification.email');
    let sentCount = 0;
    let skippedCount = 0;
    
    for (const task of tasks) {
      try {
        // ตรวจสอบว่าเคยส่ง reminder สำหรับ task นี้แล้วหรือยัง (สำหรับจำนวนวันนี้)
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        const allNotifications = await strapi.entityService.findMany(
          'api::notification.notification',
          {
            filters: {
              type: 'task_due_reminder',
              createdAt: {
                $gte: todayStart.toISOString(),
              },
            },
          }
        );
        
        // เช็คว่ามี notification ที่ส่งไปแล้วสำหรับ task นี้และจำนวนวันนี้หรือไม่
        const alreadySent = allNotifications?.some(notif => {
          try {
            const meta = JSON.parse(notif.metadata || '{}');
            return meta.taskId === task.id && meta.daysLeft === daysAhead;
          } catch {
            return false;
          }
        });
        
        if (alreadySent) {
          skippedCount++;
          strapi.log.info(`⏭️ Skipping task ${task.id} - reminder already sent today`);
          continue;
        }
        
        // ดึงข้อมูลผู้ใช้ที่รับผิดชอบ
        const assignedUser = await strapi.entityService.findOne(
          'plugin::users-permissions.user',
          task.assigned_to_user_ids_number
        );
        
        if (!assignedUser) {
          strapi.log.warn(`⚠️ User ${task.assigned_to_user_ids_number} not found for task ${task.id}`);
          continue;
        }
        
        // ดึงข้อมูลโปรเจ็กต์โดยใช้ project_document_id (Strapi 5)
        let project = null;
        if (task.project_document_id) {
          try {
            // ใช้ documentId สำหรับ Strapi 5
            // ไม่ต้อง populate created_by_user เพราะเรามี created_by_user_id อยู่แล้ว
            project = await strapi.documents('api::project.project').findOne({
              documentId: task.project_document_id,
            });
          } catch (err) {
            strapi.log.warn(`⚠️ Error fetching project ${task.project_document_id}:`, err);
          }
        }
        
        if (!project) {
          strapi.log.warn(`⚠️ Project not found for task ${task.id}`);
          continue;
        }

        // ค้นหา Project Leader (owner หรือ admin) เพื่อใช้เป็น sender
        let projectLeaderId = null;
        try {
          const projectMembers = await strapi.entityService.findMany(
            'api::project-member.project-member',
            {
              filters: {
                project_document_id: task.project_document_id,
                role: {
                  $in: ['owner', 'admin'], // ค้นหา owner หรือ admin
                },
              },
              sort: { role: 'asc' }, // owner จะมาก่อน admin
              pagination: { limit: 1 },
            }
          );

          if (projectMembers && projectMembers.length > 0) {
            projectLeaderId = projectMembers[0].user_id_in_project;
            strapi.log.info(`👤 Found project leader: user ${projectLeaderId} with role ${projectMembers[0].role}`);
          } else {
            strapi.log.warn(`⚠️ No project leader found for project ${task.project_document_id}`);
          }
        } catch (err) {
          strapi.log.warn(`⚠️ Error fetching project leader:`, err);
        }
        
        // ส่งอีเมลแจ้งเตือน
        const emailSent = await emailService.sendTaskDueDateReminderEmail(
          assignedUser,
          task,
          project,
          daysAhead
        );
        
        if (emailSent) {
          // บันทึก notification record (ใช้ Document Service API สำหรับ Strapi 5)
          try {
            // กำหนด urgency title ตามจำนวนวัน
            const urgencyTitle = daysAhead === 1 ? '🔴 URGENT' : daysAhead === 3 ? '🟠 HIGH PRIORITY' : '🟡 REMINDER';
            
            const notificationData: any = {
              type: 'task_due_reminder',
              title: `${urgencyTitle}: Task due in ${daysAhead} ${daysAhead === 1 ? 'day' : 'days'}`,
              message: `Task "${task.task_name}" is due in ${daysAhead} ${daysAhead === 1 ? 'day' : 'days'}`,
              is_read: false,
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              metadata: {
                taskId: task.id,
                daysLeft: daysAhead,
                dueDate: task.due_date,
                taskName: task.task_name,
                taskDocumentId: task.documentId,
                projectName: project.project_name,
                projectDocumentId: project.documentId,
                assignedUserId: task.assigned_to_user_ids_number,
                projectId: task.project_id_number,
              },
            };

            // ใช้ connect สำหรับ relations ใน Strapi 5
            if (task.assigned_to_user_ids_number) {
              notificationData.recipient = {
                connect: [task.assigned_to_user_ids_number]
              };
            }

            // ใช้ project leader (owner/admin) เป็น sender
            if (projectLeaderId) {
              notificationData.sender = {
                connect: [projectLeaderId]
              };
            }

            if (task.project_id_number) {
              notificationData.related_project = {
                connect: [task.project_id_number]
              };
            }
            
            await strapi.documents('api::notification.notification').create({
              data: notificationData,
            });
            
            sentCount++;
            strapi.log.info(`✉️ Reminder sent for task "${task.task_name}" (${daysAhead} days left)`);
          } catch (notifError) {
            // แสดง error แบบละเอียด
            strapi.log.error(`❌ Error creating notification for task ${task.id}:`, notifError);
            // อีเมลส่งสำเร็จแล้ว แต่ไม่สามารถบันทึก notification ได้
            sentCount++; // นับว่าส่งสำเร็จแล้ว
            strapi.log.info(`✉️ Email sent for task "${task.task_name}" but notification record failed`);
          }
        }
      } catch (taskError) {
        strapi.log.error(`❌ Error processing task ${task.id}:`, taskError);
      }
    }
    
    strapi.log.info(`📊 Summary for ${daysAhead}-day reminders: ${sentCount} sent, ${skippedCount} skipped`);
  } catch (error) {
    strapi.log.error(`❌ Error checking tasks for ${daysAhead} days ahead:`, error);
  }
}
