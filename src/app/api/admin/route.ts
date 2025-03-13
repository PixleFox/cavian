import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(admins, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin Error:', error);
    return NextResponse.json(
      { error: 'خطای سرور', details: error instanceof Error ? error.message : 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { phone_number, full_name, authority_level } = await request.json();

    // Validate input
    if (!phone_number || !full_name || !authority_level) {
      return NextResponse.json(
        { error: 'شماره موبایل، نام کامل و سطح دسترسی الزامی است' },
        { status: 400 }
      );
    }

    // Check if admin with the same phone number already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { phone_number },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'شماره موبایل تکراری است', field: 'phone_number' },
        { status: 409 }
      );
    }

    // Generate token and hash it
    const token = randomUUID();
    const tokenHash = await bcrypt.hash(token, 10);

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        phone_number,
        full_name,
        Authority_level: authority_level,
        tokenHash, // Ensure this field exists in your Prisma schema
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newAdmin.id,
          fullName: newAdmin.full_name,
          phoneNumber: newAdmin.phone_number,
          authorityLevel: newAdmin.Authority_level,
          createdAt: newAdmin.createdAt,
          token, // Return the unhashed token to the client
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin Error:', error);
    return NextResponse.json(
      { error: 'خطای سرور', details: error instanceof Error ? error.message : 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { phone_number, full_name, authority_level } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: parseInt(id) },
      data: {
        phone_number,
        full_name,
        Authority_level: authority_level,
      },
    });

    return NextResponse.json(updatedAdmin, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin Error:', error);
    return NextResponse.json(
      { error: 'خطای سرور', details: error instanceof Error ? error.message : 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });
    }

    await prisma.admin.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/admin Error:', error);
    return NextResponse.json(
      { error: 'خطای سرور', details: error instanceof Error ? error.message : 'خطای ناشناخته' },
      { status: 500 }
    );
  }
}