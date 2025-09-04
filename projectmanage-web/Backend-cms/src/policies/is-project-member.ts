'use strict';

const { errors } = require('@strapi/utils');
const { ForbiddenError, UnauthorizedError, NotFoundError } = errors;

module.exports = async (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;
  if (!user) throw new UnauthorizedError('Authentication required');

  const slug =
    policyContext.params?.slug ||
    policyContext.request?.query?.slug ||
    null;

  let projectId =
    policyContext.request?.body?.data?.project ??
    policyContext.request?.body?.project ??
    null;

  if (!projectId && slug) {
    const proj = await strapi.db
      .query('api::project.project')
      .findOne({ where: { slug }, select: ['id'] });
    projectId = proj?.id ?? null;
  }

  if (!projectId) throw new NotFoundError('Project not found');

  const count = await strapi.db
    .query('api::project-member.project-member')
    .count({ where: { project: projectId, user: user.id } });

  if (count === 0) throw new ForbiddenError('You are not a member of this project');

  policyContext.state.projectId = projectId;
  return true;
};
