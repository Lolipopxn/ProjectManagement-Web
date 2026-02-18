import axios from 'axios';
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_BASE_URL;


export async function fetchMessages(token: string, projectSlug: string, limit = 50) {
    const { data } = await axios.get(`${STRAPI}/api/projects/${projectSlug}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit }
    });
    return data as Array<{ id: number; content: string; createdAt: string; author: { id: number; username: string; email: string } }>;
}