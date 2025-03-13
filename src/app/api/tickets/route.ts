import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { user: true, messages: true },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(tickets, { status: 200 });
  } catch (error: unknown) {
    console.error('❌ GET /api/tickets Error:', error);
    return NextResponse.json(
      {
        error: 'خطای سرور در دریافت تیکت‌ها',
        details: error instanceof Error ? error.message : 'خطای ناشناخته رخ داد',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'message') {
      // Handle message posting
      const { ticket_id, message, admin_id } = await request.json();

      if (!ticket_id || !message || !admin_id) {
        return NextResponse.json(
          { error: 'ورودی نامعتبر', details: 'ticket_id, message, و admin_id الزامی است' },
          { status: 400 }
        );
      }

      // Validate ticket existence
      const ticket = await prisma.ticket.findUnique({ where: { id: Number(ticket_id) } });
      if (!ticket) {
        return NextResponse.json(
          { error: 'تیکت یافت نشد', details: `تیکت با شناسه ${ticket_id} وجود ندارد` },
          { status: 404 }
        );
      }

      // Validate admin existence
      const admin = await prisma.admin.findUnique({ where: { id: Number(admin_id) } });
      if (!admin) {
        return NextResponse.json(
          { error: 'ادمین یافت نشد', details: `ادمین با شناسه ${admin_id} وجود ندارد` },
          { status: 404 }
        );
      }

      const messageRecord = await prisma.ticketMessage.create({
        data: {
          ticket_id: Number(ticket_id),
          sender_type: 'ADMIN',
          message,
          admin_id: Number(admin_id),
        },
        include: {
          admin: true,
        },
      });

      return NextResponse.json(messageRecord, { status: 201 });
    } else {
      // Handle ticket creation
      const { user_id, subject, phone_number } = await request.json();

      if (!user_id || !subject || !phone_number) {
        return NextResponse.json(
          { error: 'ورودی نامعتبر', details: 'user_id, subject, و phone_number الزامی است' },
          { status: 400 }
        );
      }

      // Validate user existence
      const user = await prisma.user.findUnique({ where: { id: Number(user_id) } });
      if (!user) {
        return NextResponse.json(
          { error: 'کاربر یافت نشد', details: `کاربر با شناسه ${user_id} وجود ندارد` },
          { status: 404 }
        );
      }

      const ticket = await prisma.ticket.create({
        data: {
          user_id: Number(user_id),
          subject,
          phone_number,
        },
      });

      return NextResponse.json(ticket, { status: 201 });
    }
  } catch (error: unknown) {
    console.error('❌ POST /api/tickets Error:', error);
    return NextResponse.json(
      {
        error: 'خطای سرور در پردازش درخواست',
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
    const { status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ورودی نامعتبر', details: 'شناسه و وضعیت الزامی است' },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) {
      return NextResponse.json(
        { error: 'تیکت یافت نشد', details: `تیکت با شناسه ${id} وجود ندارد` },
        { status: 404 }
      );
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error: unknown) {
    console.error('❌ PUT /api/tickets Error:', error);
    return NextResponse.json(
      {
        error: 'خطای سرور در به‌روزرسانی تیکت',
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
      return NextResponse.json(
        { error: 'ورودی نامعتبر', details: 'شناسه الزامی است' },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) {
      return NextResponse.json(
        { error: 'تیکت یافت نشد', details: `تیکت با شناسه ${id} وجود ندارد` },
        { status: 404 }
      );
    }

    await prisma.ticket.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('❌ DELETE /api/tickets Error:', error);
    return NextResponse.json(
      {
        error: 'خطای سرور در حذف تیکت',
        details: error instanceof Error ? error.message : 'خطای ناشناخته رخ داد',
      },
      { status: 500 }
    );
  }
}