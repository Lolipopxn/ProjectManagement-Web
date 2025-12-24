/**
 * Email service for notifications
 */

export default ({ strapi }) => ({
  /**
   * Send project invitation email
   */
  async sendProjectInvitationEmail(recipient: any, project: any, sender: any) {
    try {
      if (!recipient.email) {
        strapi.log.warn(`User ${recipient.id} has no email address`);
        return false;
      }

      const emailTemplate = this.getProjectInvitationTemplate(recipient, project, sender);

      await strapi.plugins['email'].services.email.send({
        to: recipient.email,
        from: process.env.SMTP_USERNAME || 'project.management.std@gmail.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      strapi.log.info(`✅ Project invitation email sent to ${recipient.email}`);
      return true;
    } catch (error) {
      strapi.log.error('❌ Error sending project invitation email:', error);
      return false;
    }
  },

  /**
   * Send task assignment email
   */
  async sendTaskAssignmentEmail(recipient: any, task: any, project: any, assigner: any) {
    try {
      if (!recipient.email) {
        strapi.log.warn(`User ${recipient.id} has no email address`);
        return false;
      }

      const emailTemplate = this.getTaskAssignmentTemplate(recipient, task, project, assigner);

      await strapi.plugins['email'].services.email.send({
        to: recipient.email,
        from: process.env.SMTP_USERNAME || 'project.management.std@gmail.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      strapi.log.info(`✅ Task assignment email sent to ${recipient.email}`);
      return true;
    } catch (error) {
      strapi.log.error('❌ Error sending task assignment email:', error);
      return false;
    }
  },

  /**
   * Get project invitation email template - Minimal Modern Design
   */
  getProjectInvitationTemplate(recipient: any, project: any, sender: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const projectName = project.project_name || project.name || 'a project';
    const projectDocId = project.documentId;
    const leaderName = sender?.username || 'Project Leader';
    const recipientName = recipient.username || 'there';
    
    return {
      subject: `${leaderName} invited you to "${projectName}"`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Invitation</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #f5f5f5;
              padding: 40px 20px;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 4px;
              overflow: hidden;
              border: 1px solid #e0e0e0;
            }
            
            .header {
              background: #ffffff;
              padding: 40px 40px 30px;
              border-bottom: 1px solid #eeeeee;
            }
            
            .header h1 {
              font-size: 22px;
              font-weight: 600;
              color: #1a1a1a;
              margin: 0 0 6px 0;
              letter-spacing: -0.3px;
            }
            
            .header p {
              font-size: 14px;
              color: #666666;
              margin: 0;
            }
            
            .content {
              padding: 35px 40px;
            }
            
            .greeting {
              font-size: 14px;
              color: #333333;
              margin-bottom: 25px;
            }
            
            .invitation-message {
              background: #fafafa;
              border-left: 2px solid #333333;
              padding: 20px;
              margin: 25px 0;
            }
            
            .invitation-message p {
              font-size: 14px;
              color: #1a1a1a;
              line-height: 1.6;
              margin: 0;
            }
            
            .invitation-message strong {
              font-weight: 600;
            }
            
            .project-details {
              margin: 30px 0;
            }
            
            .label {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #999999;
              margin-bottom: 10px;
            }
            
            .project-title {
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 10px;
              letter-spacing: -0.2px;
            }
            
            .project-desc {
              font-size: 14px;
              color: #555555;
              line-height: 1.6;
              margin-bottom: 18px;
            }
            
            .meta-table {
              border-top: 1px solid #eeeeee;
              padding-top: 15px;
            }
            
            .meta-row {
              display: flex;
              padding: 5px 0;
            }
            
            .meta-key {
              font-size: 13px;
              color: #666666;
              width: 90px;
              flex-shrink: 0;
            }
            
            .meta-val {
              font-size: 13px;
              color: #1a1a1a;
              font-weight: 500;
            }
            
            .leader-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            
            .badge {
              display: inline-block;
              background: #9c27b0;
              color: #ffffff;
              font-size: 10px;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 3px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            
            .separator {
              height: 1px;
              background: #eeeeee;
              margin: 30px 0;
            }
            
            .action-area {
              text-align: center;
              margin: 35px 0 30px;
            }
            
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #e8eaf6;
              color: #5e35b1;
              text-decoration: none;
              border-radius: 3px;
              font-size: 13px;
              font-weight: 500;
              letter-spacing: 0.3px;
            }
            
            .btn:hover {
              background: #d1d4f0;
            }
            
            .link-box {
              margin-top: 18px;
              padding: 14px;
              background: #fafafa;
              border-radius: 3px;
            }
            
            .link-box p {
              font-size: 11px;
              color: #666666;
              margin: 0 0 6px 0;
            }
            
            .link-box a {
              font-size: 11px;
              color: #333333;
              word-break: break-all;
              text-decoration: none;
            }
            
            .footer {
              background: #fafafa;
              padding: 30px 40px;
              border-top: 1px solid #eeeeee;
            }
            
            .footer-text {
              font-size: 12px;
              color: #666666;
              line-height: 1.5;
            }
            
            .footer-nav {
              margin-top: 14px;
            }
            
            .footer-nav a {
              color: #333333;
              text-decoration: none;
              font-size: 12px;
              margin-right: 14px;
            }
            
            .footer-copy {
              margin-top: 18px;
              font-size: 11px;
              color: #999999;
            }
            
            @media only screen and (max-width: 600px) {
              body {
                padding: 20px 10px;
              }
              
              .header {
                padding: 30px 24px 24px;
              }
              
              .content {
                padding: 28px 24px;
              }
              
              .footer {
                padding: 24px;
              }
              
              .invitation-message {
                padding: 16px;
              }
              
              .btn {
                display: block;
                padding: 12px 20px;
              }
              
              .meta-row {
                flex-direction: column;
              }
              
              .meta-key {
                width: 100%;
                font-size: 12px;
                margin-bottom: 2px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>Project Invitation</h1>
              <p>You've been added to a new project</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Hi <strong>${recipientName}</strong>,
              </div>
              
              <!-- Invitation Message -->
              <div class="invitation-message">
                <p>
                  <strong>${leaderName}</strong> has invited you to join a project. 
                  You can now access the project workspace, view tasks, and collaborate with the team.
                </p>
              </div>
              
              <!-- Project Info -->
              <div class="project-details">
                <div class="label">Project</div>
                <div class="project-title">${projectName}</div>
                ${project.description ? `
                  <div class="project-desc">${project.description}</div>
                ` : ''}
                
                <div class="meta-table">
                  <div class="meta-row">
                    <div class="meta-key">Invited by</div>
                    <div class="meta-val">
                      <span class="leader-badge">
                        <span>${leaderName}</span>
                        <span class="badge">Leader</span>
                      </span>
                    </div>
                  </div>
                  ${project.start_date ? `
                    <div class="meta-row">
                      <div class="meta-key">Start Date</div>
                      <div class="meta-val">${new Date(project.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  ` : ''}
                  ${project.end_date ? `
                    <div class="meta-row">
                      <div class="meta-key">End Date</div>
                      <div class="meta-val">${new Date(project.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="separator"></div>
              
              <!-- Action -->
              <div class="action-area">
                <a href="${frontendUrl}/main_pages/project-overview/${projectDocId}" class="btn">
                  VIEW PROJECT
                </a>
                
                <div class="link-box">
                  <p>Or copy this link:</p>
                  <a href="${frontendUrl}/main_pages/project-overview/${projectDocId}">
                    ${frontendUrl}/main_pages/project-overview/${projectDocId}
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-text">
                You received this email because you were added to a project in Project Management System.
              </div>
              
              <div class="footer-nav">
                <a href="${frontendUrl}">Dashboard</a>
                <a href="${frontendUrl}/settings">Settings</a>
                <a href="${frontendUrl}/help">Help</a>
              </div>
              
              <div class="footer-copy">
                &copy; ${new Date().getFullYear()} Project Management System. All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  /**
   * Get task assignment email template - Minimal Modern Design
   */
  getTaskAssignmentTemplate(recipient: any, task: any, project: any, assigner: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskName = task.task_name || 'a task';
    const projectName = project.project_name || project.name || 'a project';
    const projectDocId = project.documentId;
    const assignerName = assigner?.username || 'Team Member';
    const recipientName = recipient.username || 'there';
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
    const taskStatus = task.task_status || 'To Do';
    
    // กำหนดสีตาม status
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'to do':
        case 'todo':
          return { bg: '#e3f2fd', text: '#1976d2' };
        case 'in progress':
        case 'inprogress':
          return { bg: '#fff3e0', text: '#f57c00' };
        case 'done':
        case 'completed':
          return { bg: '#e8f5e9', text: '#388e3c' };
        default:
          return { bg: '#f5f5f5', text: '#666666' };
      }
    };
    
    const statusColor = getStatusColor(taskStatus);
    
    return {
      subject: `You've been assigned to "${taskName}" in ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Assignment</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #f5f5f5;
              padding: 40px 20px;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 4px;
              overflow: hidden;
              border: 1px solid #e0e0e0;
            }
            
            .header {
              background: #ffffff;
              padding: 40px 40px 30px;
              border-bottom: 1px solid #eeeeee;
            }
            
            .header h1 {
              font-size: 22px;
              font-weight: 600;
              color: #1a1a1a;
              margin: 0 0 6px 0;
              letter-spacing: -0.3px;
            }
            
            .header p {
              font-size: 14px;
              color: #666666;
              margin: 0;
            }
            
            .content {
              padding: 35px 40px;
            }
            
            .greeting {
              font-size: 14px;
              color: #333333;
              margin-bottom: 25px;
            }
            
            .assignment-message {
              background: #e3f2fd;
              border-left: 3px solid #1976d2;
              padding: 20px;
              margin: 25px 0;
            }
            
            .assignment-message p {
              font-size: 14px;
              color: #1a1a1a;
              line-height: 1.6;
              margin: 0;
            }
            
            .assignment-message strong {
              font-weight: 600;
            }
            
            .task-details {
              margin: 30px 0;
            }
            
            .label {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #999999;
              margin-bottom: 10px;
            }
            
            .task-title {
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 10px;
              letter-spacing: -0.2px;
            }
            
            .task-desc {
              font-size: 14px;
              color: #555555;
              line-height: 1.6;
              margin-bottom: 18px;
            }
            
            .meta-table {
              border-top: 1px solid #eeeeee;
              padding-top: 15px;
            }
            
            .meta-row {
              display: flex;
              padding: 5px 0;
            }
            
            .meta-key {
              font-size: 13px;
              color: #666666;
              width: 110px;
              flex-shrink: 0;
            }
            
            .meta-val {
              font-size: 13px;
              color: #1a1a1a;
              font-weight: 500;
            }
            
            .assigner-info {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            
            .status-badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 3px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            
            .priority-high {
              background: #ffebee;
              color: #c62828;
            }
            
            .priority-medium {
              background: #fff3e0;
              color: #f57c00;
            }
            
            .priority-low {
              background: #e8f5e9;
              color: #388e3c;
            }
            
            .separator {
              height: 1px;
              background: #eeeeee;
              margin: 30px 0;
            }
            
            .action-area {
              text-align: center;
              margin: 35px 0 30px;
            }
            
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #e3f2fd;
              color: #1976d2;
              text-decoration: none;
              border-radius: 3px;
              font-size: 13px;
              font-weight: 500;
              letter-spacing: 0.3px;
            }
            
            .btn:hover {
              background: #bbdefb;
            }
            
            .link-box {
              margin-top: 18px;
              padding: 14px;
              background: #fafafa;
              border-radius: 3px;
            }
            
            .link-box p {
              font-size: 11px;
              color: #666666;
              margin: 0 0 6px 0;
            }
            
            .link-box a {
              font-size: 11px;
              color: #333333;
              word-break: break-all;
              text-decoration: none;
            }
            
            .footer {
              background: #fafafa;
              padding: 30px 40px;
              border-top: 1px solid #eeeeee;
            }
            
            .footer-text {
              font-size: 12px;
              color: #666666;
              line-height: 1.5;
            }
            
            .footer-nav {
              margin-top: 14px;
            }
            
            .footer-nav a {
              color: #333333;
              text-decoration: none;
              font-size: 12px;
              margin-right: 14px;
            }
            
            .footer-copy {
              margin-top: 18px;
              font-size: 11px;
              color: #999999;
            }
            
            @media only screen and (max-width: 600px) {
              body {
                padding: 20px 10px;
              }
              
              .header {
                padding: 30px 24px 24px;
              }
              
              .content {
                padding: 28px 24px;
              }
              
              .footer {
                padding: 24px;
              }
              
              .assignment-message {
                padding: 16px;
              }
              
              .btn {
                display: block;
                padding: 12px 20px;
              }
              
              .meta-row {
                flex-direction: column;
              }
              
              .meta-key {
                width: 100%;
                font-size: 12px;
                margin-bottom: 2px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>New Task Assignment</h1>
              <p>You've been assigned to a new task</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Hi <strong>${recipientName}</strong>,
              </div>
              
              <!-- Assignment Message -->
              <div class="assignment-message">
                <p>
                  <strong>${assignerName}</strong> has assigned you to a task in <strong>${projectName}</strong>. 
                  Please review the task details and update its progress accordingly.
                </p>
              </div>
              
              <!-- Task Info -->
              <div class="task-details">
                <div class="label">Task</div>
                <div class="task-title">${taskName}</div>
                ${task.description ? `
                  <div class="task-desc">${task.description}</div>
                ` : ''}
                
                <div class="meta-table">
                  <div class="meta-row">
                    <div class="meta-key">Project</div>
                    <div class="meta-val">${projectName}</div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Assigned by</div>
                    <div class="meta-val">
                      <span class="assigner-info">${assignerName}</span>
                    </div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Status</div>
                    <div class="meta-val">
                      <span class="status-badge" style="background: ${statusColor.bg}; color: ${statusColor.text};">
                        ${taskStatus}
                      </span>
                    </div>
                  </div>
                  ${dueDate ? `
                    <div class="meta-row">
                      <div class="meta-key">Due Date</div>
                      <div class="meta-val">${dueDate}</div>
                    </div>
                  ` : ''}
                  ${task.begin_date ? `
                    <div class="meta-row">
                      <div class="meta-key">Start Date</div>
                      <div class="meta-val">${new Date(task.begin_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="separator"></div>
              
              <!-- Action -->
              <div class="action-area">
                <a href="${frontendUrl}/main_pages/project-overview/${projectDocId}" class="btn">
                  VIEW TASK
                </a>
                
                <div class="link-box">
                  <p>Or copy this link:</p>
                  <a href="${frontendUrl}/main_pages/project-overview/${projectDocId}">
                    ${frontendUrl}/main_pages/project-overview/${projectDocId}
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-text">
                You received this email because you were assigned to a task in Project Management System.
              </div>
              
              <div class="footer-nav">
                <a href="${frontendUrl}">Dashboard</a>
                <a href="${frontendUrl}/settings">Settings</a>
                <a href="${frontendUrl}/help">Help</a>
              </div>
              
              <div class="footer-copy">
                &copy; ${new Date().getFullYear()} Project Management System. All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },
});
