import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { serialize } from 'cookie';

// Schema validation for request body
const loginSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: Request) {
  let token: string | undefined; // Declare token outside try block

  try {
    const body = await request.json();
    token = loginSchema.parse(body).token; // Assign token here
    console.log('🔍 Login attempt with token:', token);

    const admin = await prisma.admin.findFirst({
      where: {
        tokenHash: token,
        isActive: true,
      },
      select: {
        id: true,
        full_name: true,
      },
    });

    if (!admin) {
      console.warn('🚨 No active admin found with the provided token:', token);
      return NextResponse.json(
        { error: 'ادمین فعالی با این توکن یافت نشد' },
        { status: 401 }
      );
    }

    console.log('✅ Admin authenticated:', admin.full_name);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    const authCookie = serialize('admin-auth', admin.id.toString(), cookieOptions); // Explicitly convert to string for cookie

    return NextResponse.json(
      { success: true, data: { fullName: admin.full_name } },
      {
        status: 200,
        headers: {
          'Set-Cookie': authCookie,
        },
      }
    );
  } catch (error: unknown) {
    console.error('❌ Login API Error:', { error, token: token ?? 'not parsed yet' });
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'خطای اعتبارسنجی',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'خطای سرور',
        details: error instanceof Error ? error.message : 'خطای ناشناخته رخ داد',
      },
      { status: 500 }
    );
  }
}