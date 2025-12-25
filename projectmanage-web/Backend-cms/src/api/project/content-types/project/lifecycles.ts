/**
 * Project lifecycle hooks
 * Handles email notifications when project is created
 */

export default {
  /**
   * After project is created, send confirmation email to creator
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      console.log('📧 Project created, sending confirmation email...');
      console.log('Project data:', {
        id: result.id,
        documentId: result.documentId,
        project_name: result.project_name,
        created_by_user: result.created_by_user,
      });

      // Get project creator (created_by_user is integer ID)
      let creator = null;
      if (result.created_by_user) {
        const creatorResult = await strapi.entityService.findMany(
          'plugin::users-permissions.user',
          {
            filters: { id: result.created_by_user },
            limit: 1,
          }
        );
        creator = creatorResult && creatorResult.length > 0 ? creatorResult[0] : null;
        console.log('Creator found:', creator?.username);
      }

      if (!creator) {
        console.log('⚠️ No creator found for project, skipping email');
        return;
      }

      // Create notification record
      const notification = await strapi.entityService.create('api::notification.notification', {
        data: {
          type: 'project_created',
          title: `Project "${result.project_name || 'Untitled'}" created`,
          message: `You have successfully created a new project.`,
          recipient: creator.id,
          sender: creator.id, // Creator is both sender and recipient
          related_project: result.id,
          is_read: false,
          publishedAt: new Date(),
        },
      });

      console.log('✅ Notification created:', notification.id);

      // Send email
      const emailSent = await strapi
        .service('api::notification.email')
        .sendProjectCreatedEmail(creator, result);

      if (emailSent) {
        // Update notification to mark email as sent
        await strapi.entityService.update('api::notification.notification', notification.id, {
          data: {
            email_sent: true,
            email_sent_at: new Date(),
          },
        });
        console.log('✅ Project created email sent successfully');
      } else {
        console.log('⚠️ Failed to send project created email');
      }
    } catch (error) {
      console.error('❌ Error in project afterCreate lifecycle:', error);
      // Don't throw error to prevent project creation from failing
    }
  },
};
