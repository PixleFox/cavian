import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error: unknown) {
    console.error('❌ GET /api/users Error:', error);
    return NextResponse.json(
      {
        error: 'خطای سرور',
        details: error instanceof Error ? error.message : 'خطای ناشناخته رخ داد',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      full_name,
      phone_number,
      Main_Address, // Added Main Address
      email,
      national_id,
      bank_card_number,
      birth_date,
      referral_code,
      Level,
    } = data;

    const user = await prisma.user.create({
      data: {
        full_name,
        phone_number,
        Main_Address, // Added Main Address
        email,
        national_id,
        bank_card_number,
        birth_date: new Date(birth_date),
        referral_code: referral_code || null,
        Level: Level || 1,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    console.error('❌ POST /api/users Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'اطلاعات تکراری (مثلاً شماره تلفن، ایمیل، کدملی یا شماره کارت)' },
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

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    const data = await request.json();
    const {
      full_name,
      phone_number,
      Main_Address, // Added Main Address
      email,
      national_id,
      bank_card_number,
      birth_date,
      referral_code,
      Level,
    } = data;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        full_name,
        phone_number,
        Main_Address, // Added Main Address
        email,
        national_id,
        bank_card_number,
        birth_date: birth_date ? new Date(birth_date) : undefined,
        referral_code: referral_code !== undefined ? referral_code : undefined,
        Level: Level !== undefined ? Level : undefined,
      },
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error: unknown) {
    console.error('❌ PUT /api/users Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'اطلاعات تکراری (مثلاً شماره تلفن، ایمیل، کدملی یا شماره کارت)' },
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('❌ DELETE /api/users Error:', error);
    return NextResponse.json(
      {
        error: 'خطای سرور',
        details: error instanceof Error ? error.message : 'خطای ناشناخته رخ داد',
      },
      { status: 500 }
    );
  }
}