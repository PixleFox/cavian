import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Create a new discount code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, percentage, valid_until, usage_limit, is_active } = body;

    // Validation
    if (!code || !percentage || !valid_until || !usage_limit) {
      return NextResponse.json({ error: 'همه فیلدها الزامی هستند' }, { status: 400 });
    }
    if (percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: 'درصد تخفیف باید بین ۰ و ۱۰۰ باشد' }, { status: 400 });
    }
    if (usage_limit < 1) {
      return NextResponse.json({ error: 'حد استفاده باید حداقل ۱ باشد' }, { status: 400 });
    }

    // Check if code already exists
    const existingCode = await prisma.discountCode.findUnique({ where: { code } });
    if (existingCode) {
      return NextResponse.json({ error: 'این کد تخفیف قبلاً وجود دارد' }, { status: 400 });
    }

    const discount = await prisma.discountCode.create({
      data: {
        code,
        percentage,
        valid_until: new Date(valid_until),
        usage_limit,
        is_active: is_active ?? true,
      },
    });

    return NextResponse.json({ success: true, discount }, { status: 201 });
  } catch (error) {
    console.error('خطا در ایجاد کد تخفیف:', error);
    return NextResponse.json(
      { 
        error: 'خطا در سرور', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET: Fetch all discount codes or a single one by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const discount = await prisma.discountCode.findUnique({
        where: { id: Number(id) },
      });
      if (!discount) {
        return NextResponse.json({ error: 'کد تخفیف یافت نشد' }, { status: 404 });
      }
      return NextResponse.json(discount, { status: 200 });
    }

    const discounts = await prisma.discountCode.findMany();
    return NextResponse.json(discounts, { status: 200 });
  } catch (error) {
    console.error('خطا در دریافت کدهای تخفیف:', error);
    return NextResponse.json(
      { 
        error: 'خطا در سرور', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// PUT: Update an existing discount code
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });
    }

    const body = await request.json();
    const { code, percentage, valid_until, usage_limit, is_active } = body;

    // Validation
    if (!code || !percentage || !valid_until || !usage_limit) {
      return NextResponse.json({ error: 'همه فیلدها الزامی هستند' }, { status: 400 });
    }
    if (percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: 'درصد تخفیف باید بین ۰ و ۱۰۰ باشد' }, { status: 400 });
    }
    if (usage_limit < 1) {
      return NextResponse.json({ error: 'حد استفاده باید حداقل ۱ باشد' }, { status: 400 });
    }

    // Check if code exists and isn't taken by another discount
    const existingCode = await prisma.discountCode.findUnique({ where: { code } });
    if (existingCode && existingCode.id !== Number(id)) {
      return NextResponse.json({ error: 'این کد تخفیف توسط کد دیگری استفاده شده است' }, { status: 400 });
    }

    const discount = await prisma.discountCode.update({
      where: { id: Number(id) },
      data: {
        code,
        percentage,
        valid_until: new Date(valid_until),
        usage_limit,
        is_active,
      },
    });

    return NextResponse.json({ success: true, discount }, { status: 200 });
  } catch (error) {
    console.error('خطا در ویرایش کد تخفیف:', error);
    return NextResponse.json(
      { 
        error: 'خطا در سرور', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE: Remove a discount code
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });
    }

    const discount = await prisma.discountCode.findUnique({ where: { id: Number(id) } });
    if (!discount) {
      return NextResponse.json({ error: 'کد تخفیف یافت نشد' }, { status: 404 });
    }

    await prisma.discountCode.delete({ where: { id: Number(id) } });
    return NextResponse.json(
      { success: true, message: 'کد تخفیف با موفقیت حذف شد' }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('خطا در حذف کد تخفیف:', error);
    return NextResponse.json(
      { 
        error: 'خطا در سرور', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}