import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiResponseServerIO } from '../../types/next';
import { Server as IOServer } from 'socket.io';
import axios from 'axios';

export const config = { api: { bodyParser: false } };


const STRAPI = 'http://127.0.0.1:1337'

async function verifyMembership(token: string, projectSlug: string) {
    // 1) get current user
    const me = await axios.get(`${STRAPI}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const userId = me.data?.id;
    if (!userId) throw new Error('Invalid token');
    // 2) check membership by user + project slug
    const ms = await axios.get(
        `${STRAPI}/api/project-members`,
        {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                'filters[user][id][$eq]': userId,
                'filters[project][slug][$eq]': projectSlug,
                'fields[0]': 'id',
                'pagination[pageSize]': 1
            }
        }
    );
    const ok = Array.isArray(ms.data?.data) && ms.data.data.length > 0;
    if (!ok) throw new Error('Forbidden');
    return { userId };
}
export default function handler(req: NextApiRequest, res: NextApiResponse & NextApiResponseServerIO) {
    if (!res.socket.server.io) {
        const io = new IOServer(res.socket.server, {
            path: '/api/socket_io',
            cors: { origin: process.env.NEXT_PUBLIC_APP_ORIGIN?.split(',') || '*' }
        });


        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token as string;
                const projectSlug = socket.handshake.auth?.projectSlug as string;
                if (!token || !projectSlug) return next(new Error('Unauthorized'));
                const { userId } = await verifyMembership(token, projectSlug);
                (socket as any).userId = userId;
                (socket as any).projectSlug = projectSlug;
                next();
            } catch (e) { next(e as Error); }
        });


        io.on('connection', (socket) => {
            const projectSlug = (socket as any).projectSlug as string;
            const room = `project:${projectSlug}`;
            socket.join(room);
            io.to(room).emit('presence:update', { userId: (socket as any).userId, type: 'join' });


            socket.on('message:send', async (payload: { content: string }, cb?: Function) => {
                try {
                    const token = socket.handshake.auth?.token as string;
                    const content = (payload?.content || '').trim();
                    if (!content) return cb?.({ ok: false, error: 'EMPTY' });
                    const saved = await axios.post(`${STRAPI}/api/projects/${projectSlug}/messages`,
                        { content },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    io.to(room).emit('message:new', saved.data);
                    cb?.({ ok: true, message: saved.data });
                } catch (err: any) {
                    cb?.({ ok: false, error: err?.message || 'SEND_FAILED' });
                }
            });


            socket.on('typing', (state: boolean) => {
                io.to(room).emit('typing', { userId: (socket as any).userId, state });
            });


            socket.on('disconnect', () => {
                io.to(room).emit('presence:update', { userId: (socket as any).userId, type: 'leave' });
            });
        });


        res.socket.server.io = io;
    }
    res.end();
}