/**
 * Task Reminder Routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/task-reminders/send',
      handler: 'task-reminder.send',
      config: {
        auth: false, // หรือ true ถ้าต้องการให้ authenticate
      },
    },
  ],
};
