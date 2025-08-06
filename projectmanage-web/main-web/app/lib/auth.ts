import { cookies } from 'next/headers';
import axios from 'axios';

// Function สำหรับดึงข้อมูลผู้ใช้ใน server side
export const fetchUserForNavbar = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const response = await axios.get(`${process.env.STRAPI_BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user data in navbar:', error);
    return null;
  }
};
