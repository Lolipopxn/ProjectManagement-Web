// src/api/agora/controllers/agora.ts
import { Context } from 'koa';
import { RtcRole, RtcTokenBuilder } from 'agora-token';

type AuthUser = {
  id: number | string;
  documentId?: string;
};

type Membership = {
  id?: number | string;
  documentId?: string;
  user?: { id?: number | string; documentId?: string };
};

type ProjectEntity = {
  id: number | string;
  memberships?: Membership[];
};

const assertEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export default {
  async token(ctx: Context) {
    const user = ctx.state.user as AuthUser | undefined;
    if (!user) return ctx.unauthorized('Login required');

    const { projectId } = (ctx.request.body || {}) as {
      projectId?: number | string;
    };
    if (!projectId) return ctx.badRequest('projectId is required');

    // โหลดโปรเจ็กต์พร้อมสมาชิก (และความสัมพันธ์ user ใน membership) เพื่อตรวจสิทธิ์
    const project = (await strapi.entityService.findOne(
      'api::project.project',
      projectId,
      { populate: { memberships: { populate: { user: true } } } }
    )) as ProjectEntity | null;

    if (!project) return ctx.notFound('Project not found');

    // ตรวจว่า user เป็นสมาชิกโปรเจ็กต์
    const isMember = !!project.memberships?.some((m) => {
      // เผื่อมีทั้งโครงสร้างแบบอ้างอิงผู้ใช้ตรง ๆ หรือผ่าน field user
      const mid = m.id ?? m.documentId;
      const uid = user.id ?? user.documentId;
      const relUid = m.user?.id ?? m.user?.documentId;
      return mid === uid || relUid === uid;
    });

    if (!isMember) return ctx.forbidden('Not a project member');

    // โหลด env และตั้งค่าอายุ token
    const appId = process.env.AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
    const ttl = parseInt(process.env.AGORA_TOKEN_TTL || '3600', 10);

    const channelName = `project-${projectId}`;
    const account = String(user.id); // หรือใช้ documentId ตามระบบของคุณ
    const role = RtcRole.PUBLISHER;

    // ค่า “เป็นวินาทีจากตอนนี้”
    const tokenExpire = ttl;       // อายุของ token เอง
    const privilegeExpire = ttl;   // อายุของสิทธิ์ (เช่น publish/subscribe)

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      channelName,
      account,
      role,
      tokenExpire,
      privilegeExpire
    );

    const now = Math.floor(Date.now() / 1000);
    ctx.body = {
      appId,
      channelName,
      uid: account,
      token,
      // หมดอายุจริง = ตอนนี้ + ค่าน้อยสุดของสองอันนี้
      expiresAt: now + Math.min(tokenExpire, privilegeExpire),
    };
  },
};