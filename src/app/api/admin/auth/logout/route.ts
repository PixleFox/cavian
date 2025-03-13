import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    };

    const logoutCookie = serialize('admin-auth', '', cookieOptions);

    return NextResponse.json(
      { success: true, message: 'با موفقیت خارج شدید' },
      {
        status: 200,
        headers: {
          'Set-Cookie': logoutCookie,
        },
      }
    );
  } catch (error: unknown) {
    console.error('❌ Logout API Error:', error);
    return NextResponse.json(
      {
        error: 'خطای خروج',
        details: error instanceof Error ? error.message : 'خطای ناشناخته',
      },
      { status: 500 }
    );
  }
}