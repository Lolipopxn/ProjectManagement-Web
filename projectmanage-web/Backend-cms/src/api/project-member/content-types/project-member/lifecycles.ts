/**
 * Project Member lifecycle hooks
 */

export default {
  /**
   * After creating a project member - send invitation email
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      console.log('🔔 [LIFECYCLE] Project member created:', result.id);

      // Get full project member data with relations
      const projectMember = await strapi.entityService.findOne(
        'api::project-member.project-member',
        result.id,
        {
          populate: ['project_id', 'user_ids'],
        }
      );

      if (!projectMember) {
        console.log('⚠️ [LIFECYCLE] Project member not found');
        return;
      }

      console.log('📧 [LIFECYCLE] Project member data:', {
        id: projectMember.id,
        userId: projectMember.user_id_in_project,
        projectId: projectMember.project_id_number,
        role: projectMember.role_in_project,
      });

      // Get user by user_id_in_project
      const recipient = await strapi.entityService.findMany(
        'plugin::users-permissions.user',
        {
          filters: { id: projectMember.user_id_in_project },
          limit: 1,
        }
      );

      if (!recipient || recipient.length === 0) {
        console.log('⚠️ [LIFECYCLE] Recipient user not found');
        return;
      }

      const user = recipient[0];

      // Get project by project_id_number
      const projects = await strapi.entityService.findMany(
        'api::project.project',
        {
          filters: { id: projectMember.project_id_number },
          limit: 1,
        }
      );

      if (!projects || projects.length === 0) {
        console.log('⚠️ [LIFECYCLE] Project not found');
        return;
      }

      const project = projects[0];

      // Get project creator/owner (sender)
      let sender = null;
      if ((project as any).created_by_user) {
        const senderResult = await strapi.entityService.findMany(
          'plugin::users-permissions.user',
          {
            filters: { id: (project as any).created_by_user },
            limit: 1,
          }
        );
        sender = senderResult && senderResult.length > 0 ? senderResult[0] : null;
      }

      console.log('✅ [LIFECYCLE] Found user and project:', {
        userEmail: user.email,
        projectName: (project as any).project_name,
        senderName: sender?.username || 'Unknown',
        senderId: (project as any).created_by_user,
        recipientId: user.id,
      });

      // Check if the recipient is the same as the project creator
      const isCreator = sender && user.id === sender.id;

      console.log('🔍 [LIFECYCLE] Checking user type:', {
        isCreator,
        creatorId: sender?.id,
        recipientId: user.id,
      });

      // Determine notification type and email to send
      let notificationType;
      let notificationTitle;
      let notificationMessage;
      let emailSent = false;

      if (isCreator) {
        // If recipient is the creator, send "Project Created Successfully" email
        notificationType = 'project_created';
        notificationTitle = 'Project Created';
        notificationMessage = `Your project "${(project as any).project_name}" has been created successfully`;

        console.log('📧 [LIFECYCLE] Sending project created email to creator');

        // Create notification record
        const notification = await strapi.entityService.create(
          'api::notification.notification',
          {
            data: {
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              recipient: user.id,
              sender: user.id, // Creator is both sender and recipient
              related_project: project.id,
              is_read: false,
              email_sent: false,
            },
          }
        );

        console.log('✅ [LIFECYCLE] Notification created:', notification.id);

        // Send project created email
        const emailService = strapi.service('api::notification.email');
        emailSent = await emailService.sendProjectCreatedEmail(user, project);

        // Update notification with email status
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
          console.log('✅ [LIFECYCLE] Project created email sent and notification updated');
        }
      } else {
        // If recipient is a different user, send "Project Invitation" email
        notificationType = 'project_invitation';
        notificationTitle = 'Added to Project';
        notificationMessage = `You have been added to project "${(project as any).project_name}" as ${projectMember.role_in_project}`;

        console.log('📧 [LIFECYCLE] Sending project invitation email to member');

        // Create notification record
        const notification = await strapi.entityService.create(
          'api::notification.notification',
          {
            data: {
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              recipient: user.id,
              sender: sender?.id || null,
              related_project: project.id,
              is_read: false,
              email_sent: false,
            },
          }
        );

        console.log('✅ [LIFECYCLE] Notification created:', notification.id);

        // Send invitation email
        const emailService = strapi.service('api::notification.email');
        emailSent = await emailService.sendProjectInvitationEmail(
          user,
          project,
          sender
        );

        // Update notification with email status
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
          console.log('✅ [LIFECYCLE] Invitation email sent and notification updated');
        }
      }

    } catch (error) {
      console.error('❌ [LIFECYCLE] Error in project-member afterCreate:', error);
      strapi.log.error('Error in project-member afterCreate lifecycle:', error);
    }
  },
};
