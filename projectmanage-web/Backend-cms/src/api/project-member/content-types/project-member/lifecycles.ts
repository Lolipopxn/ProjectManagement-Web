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
      if ((project as any).created_by_user_id) {
        const senderResult = await strapi.entityService.findMany(
          'plugin::users-permissions.user',
          {
            filters: { id: (project as any).created_by_user_id },
            limit: 1,
          }
        );
        sender = senderResult && senderResult.length > 0 ? senderResult[0] : null;
      }

      console.log('✅ [LIFECYCLE] Found user and project:', {
        userEmail: user.email,
        projectName: (project as any).project_name,
        senderName: sender?.username || 'Unknown',
      });

      // Create notification record
      const notification = await strapi.entityService.create(
        'api::notification.notification',
        {
          data: {
            type: 'project_invitation',
            title: 'Added to Project',
            message: `You have been added to project "${(project as any).project_name}" as ${projectMember.role_in_project}`,
            recipient: user.id,
            sender: sender?.id || null,
            related_project: project.id,
            is_read: false,
            email_sent: false,
          },
        }
      );

      console.log('✅ [LIFECYCLE] Notification created:', notification.id);

      // Send email
      const emailService = strapi.service('api::notification.email');
      const emailSent = await emailService.sendProjectInvitationEmail(
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
        console.log('✅ [LIFECYCLE] Email sent and notification updated');
      }

    } catch (error) {
      console.error('❌ [LIFECYCLE] Error in project-member afterCreate:', error);
      strapi.log.error('Error in project-member afterCreate lifecycle:', error);
    }
  },
};
