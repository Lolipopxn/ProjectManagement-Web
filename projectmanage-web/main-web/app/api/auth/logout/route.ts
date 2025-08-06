import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Processing logout request...');

    // สร้าง response สำหรับ logout
    const response = NextResponse.json(
      { 
        message: 'Logout successful',
        success: true 
      },
      { status: 200 }
    );

    // ล้าง cookies โดยการ set ให้หมดอายุ
    response.cookies.set('token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // ตั้งให้หมดอายุในอดีต
      path: '/'
    });

    // ล้าง cookies เพิ่มเติมหากมี
    response.cookies.set('user', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    });

    console.log('User logged out successfully');
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { 
        error: 'Logout failed',
        message: 'An error occurred during logout',
        success: false
      },
      { status: 500 }
    );
  }
}

// Support GET request as well for simple logout links
export async function GET(request: NextRequest) {
  return POST(request);
}
