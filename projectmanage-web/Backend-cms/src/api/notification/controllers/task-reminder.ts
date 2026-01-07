/**
 * Task Reminder Controller
 * Manual trigger for testing task due date reminders
 */

export default {
  /**
   * Manually trigger task due date reminders (for testing)
   * GET /api/task-reminders/send
   */
  async send(ctx) {
    try {
      const { daysAhead } = ctx.query;
      
      if (!daysAhead || ![1, 3, 7].includes(parseInt(daysAhead))) {
        return ctx.badRequest('Invalid daysAhead parameter. Must be 1, 3, or 7.');
      }
      
      const days = parseInt(daysAhead);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // คำนวณวันที่เป้าหมาย
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // ค้นหา tasks
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
        return ctx.send({
          success: true,
          message: `No tasks found due in ${days} days`,
          data: {
            tasksChecked: 0,
            emailsSent: 0,
            targetDate: targetDate.toISOString(),
          },
        });
      }
      
      const emailService = strapi.service('api::notification.email');
      let sentCount = 0;
      const errors = [];
      
      for (const task of tasks) {
        try {
          // ดึงข้อมูลผู้ใช้
          const assignedUser = await strapi.entityService.findOne(
            'plugin::users-permissions.user',
            task.assigned_to_user_ids_number
          );
          
          if (!assignedUser) {
            errors.push(`User ${task.assigned_to_user_ids_number} not found for task ${task.id}`);
            continue;
          }
          
          // ดึงข้อมูลโปรเจ็กต์
          let project = null;
          if (task.project_document_id) {
            project = await strapi.entityService.findOne(
              'api::project.project',
              task.project_document_id
            );
          }
          
          if (!project) {
            errors.push(`Project not found for task ${task.id}`);
            continue;
          }
          
          // ส่งอีเมล
          const emailSent = await emailService.sendTaskDueDateReminderEmail(
            assignedUser,
            task,
            project,
            days
          );
          
          if (emailSent) {
            sentCount++;
          }
        } catch (error) {
          errors.push(`Error processing task ${task.id}: ${error.message}`);
        }
      }
      
      return ctx.send({
        success: true,
        message: `Processed ${tasks.length} tasks due in ${days} days`,
        data: {
          tasksChecked: tasks.length,
          emailsSent: sentCount,
          targetDate: targetDate.toISOString(),
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error) {
      strapi.log.error('Error in manual task reminder trigger:', error);
      return ctx.internalServerError('Failed to send task reminders');
    }
  },
};
