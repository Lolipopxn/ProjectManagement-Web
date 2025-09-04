/**
 * chat controller
 */

'use strict';
const { createCoreController } = require('@strapi/strapi').factories;


module.exports = createCoreController('api::chat.chat', ({ strapi }) => ({
    async findByProjectSlug(ctx) {
        const limit = Math.min(parseInt(ctx.query.limit) || 50, 200);
        const messages = await strapi.entityService.findMany('api::chat.chat', {
            filters: { project: ctx.state.projectId },
            sort: { createdAt: 'asc' },
            populate: { author: { fields: ['id', 'username', 'email'] } },
            limit
        });
        return messages;
    },


    async createForProject(ctx) {
        const user = ctx.state.user;
        const body = ctx.request.body?.data || ctx.request.body || {};
        const content = (body.content || '').trim();
        if (!content) return ctx.badRequest('Content is empty');


        const entry = await strapi.entityService.create('api::chat.chat', {
            data: { content, project: ctx.state.projectId, author: user.id, sent_at: new Date().toISOString(), },
            populate: {
                author: { fields: ['username', 'email'] },
                project: { fields: ['id', 'slug'] },
            },
        });
        return entry;
    }
}));
