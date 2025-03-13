import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  let adminAuthCookie: string | undefined; // Declare adminAuthCookie outside the try block

  try {
    const cookies = request.headers.get('cookie') || '';
    const cookiePairs = cookies.split(';').map(cookie => cookie.trim());
    adminAuthCookie = cookiePairs
      .find(cookie => cookie.startsWith('admin-auth='))
      ?.split('=')[1];

    if (!adminAuthCookie) {
      console.log('🔍 No admin-auth cookie found');
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Convert cookie value to integer since Admin.id is an Int in Prisma schema
    const adminId = parseInt(adminAuthCookie, 10);
    if (isNaN(adminId)) {
      console.warn('🚨 Invalid admin ID in cookie:', adminAuthCookie);
      return NextResponse.json(
        { authenticated: false, error: 'شناسه ادمین نامعتبر است' },
        { status: 401 }
      );
    }

    // Verify admin exists and is active
    const admin = await prisma.admin.findUnique({
      where: {
        id: adminId, // Now an integer
        isActive: true,
      },
      select: {
        id: true,
        full_name: true,
      },
    });

    if (!admin) {
      console.warn('🚨 No active admin found with ID:', adminId);
      return NextResponse.json(
        { authenticated: false, error: 'کاربر معتبر نیست' },
        { status: 401 }
      );
    }

    console.log('✅ Admin verified:', admin.full_name);
    return NextResponse.json({
      authenticated: true,
      data: {
        id: admin.id,
        fullName: admin.full_name,
      },
    });
  } catch (error: unknown) {
    console.error('❌ Me API Error:', { error, adminAuthCookie }); // Now adminAuthCookie is accessible
    return NextResponse.json(
      {
        error: 'خطای احراز هویت',
        details: error instanceof Error ? error.message : 'خطای ناشناخته',
      },
      { status: 500 }
    );
  }
}