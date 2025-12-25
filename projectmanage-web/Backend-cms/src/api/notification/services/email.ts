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
   * Send submission pending review email to project leader
   */
  async sendSubmissionPendingEmail(leader: any, task: any, project: any, submitter: any) {
    try {
      if (!leader.email) {
        strapi.log.warn(`Leader ${leader.id} has no email address`);
        return false;
      }

      const emailTemplate = this.getSubmissionPendingTemplate(leader, task, project, submitter);

      await strapi.plugins['email'].services.email.send({
        to: leader.email,
        from: process.env.SMTP_USERNAME || 'project.management.std@gmail.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      strapi.log.info(`✅ Submission pending email sent to ${leader.email}`);
      return true;
    } catch (error) {
      strapi.log.error('❌ Error sending submission pending email:', error);
      return false;
    }
  },

  /**
   * Send submission approved email to member
   */
  async sendSubmissionApprovedEmail(member: any, task: any, project: any, leader: any) {
    try {
      if (!member.email) {
        strapi.log.warn(`Member ${member.id} has no email address`);
        return false;
      }

      const emailTemplate = this.getSubmissionApprovedTemplate(member, task, project, leader);

      await strapi.plugins['email'].services.email.send({
        to: member.email,
        from: process.env.SMTP_USERNAME || 'project.management.std@gmail.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      strapi.log.info(`✅ Submission approved email sent to ${member.email}`);
      return true;
    } catch (error) {
      strapi.log.error('❌ Error sending submission approved email:', error);
      return false;
    }
  },

  /**
   * Send submission rejected email to member
   */
  async sendSubmissionRejectedEmail(member: any, task: any, project: any, leader: any, reason?: string) {
    try {
      if (!member.email) {
        strapi.log.warn(`Member ${member.id} has no email address`);
        return false;
      }

      const emailTemplate = this.getSubmissionRejectedTemplate(member, task, project, leader, reason);

      await strapi.plugins['email'].services.email.send({
        to: member.email,
        from: process.env.SMTP_USERNAME || 'project.management.std@gmail.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      strapi.log.info(`✅ Submission rejected email sent to ${member.email}`);
      return true;
    } catch (error) {
      strapi.log.error('❌ Error sending submission rejected email:', error);
      return false;
    }
  },

  /**
   * Send project created confirmation email to creator
   */
  async sendProjectCreatedEmail(creator: any, project: any) {
    try {
      if (!creator.email) {
        strapi.log.warn(`Creator ${creator.id} has no email address`);
        return false;
      }

      const emailTemplate = this.getProjectCreatedTemplate(creator, project);

      await strapi.plugins['email'].services.email.send({
        to: creator.email,
        from: process.env.SMTP_USERNAME || 'project.management.std@gmail.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      strapi.log.info(`✅ Project created email sent to ${creator.email}`);
      return true;
    } catch (error) {
      strapi.log.error('❌ Error sending project created email:', error);
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

  /**
   * Get submission pending review email template - Green Theme
   */
  getSubmissionPendingTemplate(leader: any, task: any, project: any, submitter: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskName = task.task_name || 'a task';
    const projectName = project.project_name || project.name || 'a project';
    const projectDocId = project.documentId;
    const submitterName = submitter?.username || 'Team Member';
    const leaderName = leader.username || 'there';
    
    return {
      subject: `${submitterName} submitted "${taskName}" - Pending Review`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Submission Pending Review</title>
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
            
            .submission-message {
              background: #e8f5e9;
              border-left: 3px solid #388e3c;
              padding: 20px;
              margin: 25px 0;
            }
            
            .submission-message p {
              font-size: 14px;
              color: #1a1a1a;
              line-height: 1.6;
              margin: 0;
            }
            
            .submission-message strong {
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
            
            .status-badge {
              display: inline-block;
              background: #fff3e0;
              color: #f57c00;
              padding: 3px 10px;
              border-radius: 3px;
              font-size: 11px;
              font-weight: 600;
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
              background: #e8f5e9;
              color: #2e7d32;
              text-decoration: none;
              border-radius: 3px;
              font-size: 13px;
              font-weight: 500;
              letter-spacing: 0.3px;
            }
            
            .btn:hover {
              background: #c8e6c9;
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
              
              .submission-message {
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
              <h1>Submission Pending Review</h1>
              <p>A team member has submitted work for review</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Hi <strong>${leaderName}</strong>,
              </div>
              
              <!-- Submission Message -->
              <div class="submission-message">
                <p>
                  <strong>${submitterName}</strong> has submitted their work for <strong>${taskName}</strong> in ${projectName}. 
                  Please review the submission and provide feedback.
                </p>
              </div>
              
              <!-- Task Info -->
              <div class="task-details">
                <div class="label">Task Details</div>
                <div class="task-title">${taskName}</div>
                
                <div class="meta-table">
                  <div class="meta-row">
                    <div class="meta-key">Project</div>
                    <div class="meta-val">${projectName}</div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Submitted by</div>
                    <div class="meta-val">${submitterName}</div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Status</div>
                    <div class="meta-val">
                      <span class="status-badge">Pending Review</span>
                    </div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Submitted at</div>
                    <div class="meta-val">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
              
              <div class="separator"></div>
              
              <!-- Action -->
              <div class="action-area">
                <a href="${frontendUrl}/main_pages/project-overview/${projectDocId}" class="btn">
                  REVIEW SUBMISSION
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
                You received this email because a submission was made in your project.
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
   * Get submission approved email template - Green Theme
   */
  getSubmissionApprovedTemplate(member: any, task: any, project: any, leader: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskName = task.task_name || 'a task';
    const projectName = project.project_name || project.name || 'a project';
    const projectDocId = project.documentId;
    const leaderName = leader?.username || 'Project Leader';
    const memberName = member.username || 'there';
    
    return {
      subject: `Your submission for "${taskName}" has been approved`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Submission Approved</title>
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
            
            .approval-message {
              background: #e8f5e9;
              border-left: 3px solid #388e3c;
              padding: 20px;
              margin: 25px 0;
            }
            
            .approval-message p {
              font-size: 14px;
              color: #1a1a1a;
              line-height: 1.6;
              margin: 0;
            }
            
            .approval-message strong {
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
            
            .status-badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 3px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            
            .status-completed {
              background: #e8f5e9;
              color: #2e7d32;
            }
            
            .status-approved {
              background: #c8e6c9;
              color: #1b5e20;
              font-size: 12px;
              padding: 4px 12px;
            }
            
            .leader-badge {
              display: inline-flex;
              align-items: center;
              gap: 14px;
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
              background: #e8f5e9;
              color: #2e7d32;
              text-decoration: none;
              border-radius: 3px;
              font-size: 13px;
              font-weight: 500;
              letter-spacing: 0.3px;
            }
            
            .btn:hover {
              background: #c8e6c9;
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
              
              .approval-message {
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
              <h1>Submission Approved</h1>
              <p>Your work has been reviewed and approved</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Hi <strong>${memberName}</strong>,
              </div>
              
              <!-- Approval Message -->
              <div class="approval-message">
                <p>
                  <strong>Congratulations!</strong> Your work has been reviewed and approved by <strong>${leaderName}</strong>. 
                  The task <strong>${taskName}</strong> has been marked as completed.
                </p>
              </div>
              
              <!-- Task Info -->
              <div class="task-details">
                <div class="label">Task Details</div>
                <div class="task-title">${taskName}</div>
                
                <div class="meta-table">
                  <div class="meta-row">
                    <div class="meta-key">Project</div>
                    <div class="meta-val">${projectName}</div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Reviewed by</div>
                    <div class="meta-val">
                      <span class="leader-badge">
                        <span>${leaderName}</span>
                        <span class="badge">Leader</span>
                      </span>
                    </div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Status</div>
                    <div class="meta-val">
                      <span class="status-badge status-completed">Completed</span>
                    </div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Approved at</div>
                    <div class="meta-val">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
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
                You received this email because your submission was approved.
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
   * Get submission rejected email template - Red Theme
   */
  getSubmissionRejectedTemplate(member: any, task: any, project: any, leader: any, reason?: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskName = task.task_name || 'a task';
    const projectName = project.project_name || project.name || 'a project';
    const projectDocId = project.documentId;
    const leaderName = leader?.username || 'Project Leader';
    const memberName = member.username || 'there';
    const rejectionReason = reason || 'No specific reason provided.';
    
    return {
      subject: `Your submission for "${taskName}" needs revision`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Submission Needs Revision</title>
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
            
            .rejection-message {
              background: #ffebee;
              border-left: 3px solid #c62828;
              padding: 20px;
              margin: 25px 0;
            }
            
            .rejection-message p {
              font-size: 14px;
              color: #1a1a1a;
              line-height: 1.6;
              margin: 0;
            }
            
            .rejection-message strong {
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
            
            .status-badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 3px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            
            .status-rejected {
              background: #ffebee;
              color: #c62828;
            }
            
            .leader-badge {
              display: inline-flex;
              align-items: center;
              gap: 14px;
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
            
            .reason-box {
              background: #fafafa;
              border: 1px solid #eeeeee;
              border-radius: 3px;
              padding: 16px;
              margin: 20px 0;
            }
            
            .reason-box h4 {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #666666;
              margin-bottom: 10px;
            }
            
            .reason-box p {
              font-size: 13px;
              color: #333333;
              line-height: 1.6;
              margin: 0;
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
              background: #ffebee;
              color: #c62828;
              text-decoration: none;
              border-radius: 3px;
              font-size: 13px;
              font-weight: 500;
              letter-spacing: 0.3px;
            }
            
            .btn:hover {
              background: #ffcdd2;
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
              
              .rejection-message {
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
              <h1>Submission Needs Revision</h1>
              <p>Your work requires additional changes</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Hi <strong>${memberName}</strong>,
              </div>
              
              <!-- Rejection Message -->
              <div class="rejection-message">
                <p>
                  <strong>${leaderName}</strong> has reviewed your submission for <strong>${taskName}</strong> 
                  and has requested revisions. Please review the feedback below and resubmit your work.
                </p>
              </div>
              
              <!-- Feedback Reason -->
              <div class="reason-box">
                <h4>Feedback from ${leaderName}</h4>
                <p>${rejectionReason}</p>
              </div>
              
              <!-- Task Info -->
              <div class="task-details">
                <div class="label">Task Details</div>
                <div class="task-title">${taskName}</div>
                
                <div class="meta-table">
                  <div class="meta-row">
                    <div class="meta-key">Project</div>
                    <div class="meta-val">${projectName}</div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Reviewed by</div>
                    <div class="meta-val">
                      <span class="leader-badge">
                        <span>${leaderName}</span>
                        <span class="badge">Leader</span>
                      </span>
                    </div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Status</div>
                    <div class="meta-val">
                      <span class="status-badge status-rejected">Rejected</span>
                    </div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-key">Reviewed at</div>
                    <div class="meta-val">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
              
              <div class="separator"></div>
              
              <!-- Action -->
              <div class="action-area">
                <a href="${frontendUrl}/main_pages/project-overview/${projectDocId}" class="btn">
                  REVISE & RESUBMIT
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
                You received this email because your submission requires revision.
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
   * Get project created confirmation email template - Purple Theme
   */
  getProjectCreatedTemplate(creator: any, project: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const projectName = project.project_name || project.name || 'your project';
    const projectDocId = project.documentId;
    const creatorName = creator?.username || 'there';
    
    return {
      subject: `Project "${projectName}" created successfully`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Created Successfully</title>
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
            
            .success-message {
              background: #fafafa;
              border-left: 2px solid #333333;
              padding: 20px;
              margin: 25px 0;
            }
            
            .success-message p {
              font-size: 14px;
              color: #1a1a1a;
              line-height: 1.6;
              margin: 0;
            }
            
            .success-message strong {
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
            
            .separator {
              height: 1px;
              background: #eeeeee;
              margin: 30px 0;
            }
            
            .next-steps {
              background: #f9f9f9;
              padding: 20px;
              margin: 25px 0;
              border-radius: 3px;
            }
            
            .next-steps h3 {
              font-size: 13px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .next-steps ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            
            .next-steps li {
              font-size: 13px;
              color: #555555;
              padding: 4px 0;
              padding-left: 20px;
              position: relative;
            }
            
            .next-steps li:before {
              content: "→";
              position: absolute;
              left: 0;
              color: #5e35b1;
              font-weight: bold;
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
              
              .success-message {
                padding: 16px;
              }
              
              .next-steps {
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
              <h1>Project Created Successfully</h1>
              <p>Your project has been set up and is ready to go</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Hi <strong>${creatorName}</strong>,
              </div>
              
              <!-- Success Message -->
              <div class="success-message">
                <p>
                  Your project <strong>${projectName}</strong> has been created successfully. 
                  You can now invite team members, create tasks, and start collaborating.
                </p>
              </div>
              
              <!-- Project Info -->
              <div class="project-details">
                <div class="label">Project Details</div>
                <div class="project-title">${projectName}</div>
                ${project.description ? `
                  <div class="project-desc">${project.description}</div>
                ` : ''}
                
                <div class="meta-table">
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
                  <div class="meta-row">
                    <div class="meta-key">Created</div>
                    <div class="meta-val">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
              
              <!-- Next Steps -->
              <div class="next-steps">
                <h3>Next Steps</h3>
                <ul>
                  <li>Invite team members to collaborate on your project</li>
                  <li>Create tasks and assign them to team members</li>
                  <li>Set up project milestones and deadlines</li>
                  <li>Track progress and communicate with your team</li>
                </ul>
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
                You received this email because you created a new project in Project Management System.
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
