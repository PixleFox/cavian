// src/app/api/orders/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'UNDER_CONSIDERATION';

// Define the Order type based on Prisma schema fields used in this file
interface Order {
  id: number;
  order_status: OrderStatus;
  created_at: Date;
  updated_at: Date | null;
}

// Transform function with typed order parameter
const transformOrder = (order: Order) => ({
  ...order,
  order_status: order.order_status.toLowerCase(), // Transform to lowercase for frontend
  created_at: order.created_at.toISOString(),
  updated_at: order.updated_at?.toISOString(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params to access id
    const { id } = await params;
    const orderId = Number(id);
    const { new_status }: { new_status: string } = await request.json();

    if (!orderId || !new_status) {
      return NextResponse.json({ error: 'Order ID and new status are required' }, { status: 400 });
    }

    // Validate the status against the Prisma enum (uppercase)
    const validStatuses: OrderStatus[] = [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'UNDER_CONSIDERATION',
    ];
    const upperCaseStatus = new_status.toUpperCase() as OrderStatus;
    if (!validStatuses.includes(upperCaseStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { order_status: upperCaseStatus }, // Use uppercase for Prisma
    });

    await prisma.orderStatusHistory.create({
      data: {
        order_id: orderId,
        old_status: order.order_status,
        new_status: upperCaseStatus,
      },
    });

    return NextResponse.json({ success: true, order: transformOrder(updatedOrder) }, { status: 200 });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return NextResponse.json(
      {
        error: 'Error updating order status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}