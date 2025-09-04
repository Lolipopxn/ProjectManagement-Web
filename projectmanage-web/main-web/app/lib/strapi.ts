import axios from 'axios';
const STRAPI = process.env.STRAPI_BASE_URL;


export async function fetchMessages(token: string, projectSlug: string, limit = 50) {
    const { data } = await axios.get(`http://127.0.0.1:1337/api/projects/${projectSlug}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit }
    });
    return data as Array<{ id: number; content: string; createdAt: string; author: { id: number; username: string; email: string } }>;
}