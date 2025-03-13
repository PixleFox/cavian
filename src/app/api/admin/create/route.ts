import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAdminToken } from '@/lib/tokens';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema validation for request body
const createAdminSchema = z.object({
  phone_number: z.string().min(1, 'Phone number is required').regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  full_name: z.string().min(1, 'Full name is required'),
  authority_level: z.number().int().min(1, 'Authority level must be a positive integer'),
});

// Type for the request body after validation
type CreateAdminBody = z.infer<typeof createAdminSchema>;

export async function POST(request: Request) {
  let body: CreateAdminBody | undefined;

  try {
    // Parse and validate request body
    const rawBody = await request.json();
    body = createAdminSchema.parse(rawBody);
    const { phone_number, full_name, authority_level } = body;

    console.log('🔍 Attempting to create admin with:', { phone_number, full_name, authority_level });

    // Generate token and hash
    const { token, tokenHash } = generateAdminToken();

    // TODO: Replace with authenticated admin ID from context (e.g., cookie)
    const creatorId = 1; // Placeholder - should come from auth context

    // Create admin in database
    const newAdmin = await prisma.admin.create({
      data: {
        phone_number,
        full_name,
        tokenHash,
        Authority_level: authority_level,
        creatorId,
      },
      select: {
        id: true,
        full_name: true,
        phone_number: true,
        Authority_level: true,
        createdAt: true,
      },
    });

    console.log('✅ Admin Created:', newAdmin);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newAdmin.id,
          fullName: newAdmin.full_name,
          phoneNumber: newAdmin.phone_number,
          authorityLevel: newAdmin.Authority_level,
          createdAt: newAdmin.createdAt,
          token,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('❌ Error creating admin:', { error, body: body || 'Body not parsed yet' });

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'خطای اعتبارسنجی',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'unknown field';
      // Since `id` is auto-incremented, this should be `phone_number` or `tokenHash`
      const field = target.includes('phone_number') ? 'شماره تلفن' : target.includes('tokenHash') ? 'توکن' : 'فیلد ناشناخته';
      return NextResponse.json(
        {
          success: false,
          error: `ورودی تکراری: ${field}`,
        },
        { status: 409 }
      );
    }

    // Handle other Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: 'خطای پایگاه داده',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Fallback for unknown errors
    return NextResponse.json(
      {
        success: false,
        error: 'خطای سرور',
        details: error instanceof Error ? error.message : 'خطای ناشناخته رخ داد',
      },
      { status: 500 }
    );
  }
}