// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface OrderData {
  user_id: number;
  address_id: number;
  subtotal_amount: number;
  shipping_cost: number;
  total_amount: number;
  items: {
    variant_id: number;
    quantity: number;
    price_at_order: number;
  }[];
  discounts?: {
    discount_code: string;
    applied_amount: number;
  }[];
}

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'UNDER_CONSIDERATION';
type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'; // Adjust based on your Prisma schema

// Define the Order type to match Prisma's structure
interface Order {
  id: number;
  user_id: number;
  address_id: number;
  subtotal_amount: Prisma.Decimal;
  shipping_cost: Prisma.Decimal;
  total_amount: Prisma.Decimal;
  order_status: OrderStatus;
  created_at: Date;
  updated_at: Date | null;
  items: {
    id: number;
    order_id: number;
    variant_id: number;
    quantity: number;
    price_at_order: Prisma.Decimal;
    variant?: {
      id: number;
      product: {
        id: number;
        name: string;
      };
    };
  }[];
  discounts: {
    id: number;
    order_id: number;
    discount_code: string;
    applied_amount: Prisma.Decimal;
  }[];
  statusHistory: {
    id: number;
    order_id: number;
    old_status: OrderStatus;
    new_status: OrderStatus;
    changed_at: Date;
  }[];
  user?: {
    id: number;
    full_name: string;
  };
  address?: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    user_id: number;
    address_type: string;
    city: string;
    state_province: string;
    street: string;
    block: string | null;
    postal_code: string;
    is_main_address: boolean;
  };
  payment?: {
    id: number;
    status: PaymentStatus; // Match Prisma's field name
    createdAt: Date;
    updatedAt: Date;
    user_id: number;
    order_id: number | null;
    gateway_name: string;
    gateway_transaction_id: string;
    processed_at: Date | null;
  } | null;
}

// Transform function with Decimal-to-number conversion and payment handling
const transformOrder = (order: Order) => ({
  ...order,
  subtotal_amount: order.subtotal_amount.toNumber(),
  shipping_cost: order.shipping_cost.toNumber(),
  total_amount: order.total_amount.toNumber(),
  order_status: order.order_status.toLowerCase(),
  created_at: order.created_at.toISOString(),
  updated_at: order.updated_at?.toISOString(),
  items: order.items.map((item) => ({
    ...item,
    price_at_order: item.price_at_order.toNumber(),
  })),
  discounts: order.discounts.map((discount) => ({
    ...discount,
    applied_amount: discount.applied_amount.toNumber(),
  })),
  address: order.address
    ? {
        id: order.address.id,
        address_line: `${order.address.street}${order.address.block ? `, ${order.address.block}` : ''}, ${order.address.city}, ${order.address.state_province}, ${order.address.postal_code}`,
      }
    : undefined,
  payment: order.payment
    ? {
        id: order.payment.id,
        payment_status: order.payment.status, // Rename `status` to `payment_status` for frontend
      }
    : null,
});

export async function POST(request: Request) {
  try {
    const orderData: OrderData = await request.json();

    const errors: Record<string, string> = {};
    if (!orderData.user_id) errors.user_id = 'User ID is required';
    if (!orderData.address_id) errors.address_id = 'Address ID is required';
    if (!orderData.subtotal_amount) errors.subtotal_amount = 'Subtotal amount is required';
    if (!orderData.shipping_cost) errors.shipping_cost = 'Shipping cost is required';
    if (!orderData.total_amount) errors.total_amount = 'Total amount is required';
    if (!orderData.items || orderData.items.length === 0) errors.items = 'At least one item is required';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation errors', details: errors }, { status: 400 });
    }

    const userExists = await prisma.user.findUnique({ where: { id: orderData.user_id } });
    if (!userExists) errors.user_id = 'User does not exist';

    const addressExists = await prisma.userAddress.findUnique({ where: { id: orderData.address_id } });
    if (!addressExists) errors.address_id = 'Address does not exist';

    for (const item of orderData.items) {
      const variantExists = await prisma.productVariant.findUnique({ where: { id: item.variant_id } });
      if (!variantExists) errors.items = `Variant with ID ${item.variant_id} does not exist`;
    }

    if (orderData.discounts) {
      for (const discount of orderData.discounts) {
        const discountExists = await prisma.discountCode.findUnique({ where: { code: discount.discount_code } });
        if (!discountExists) errors.discounts = `Discount code ${discount.discount_code} does not exist`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation errors', details: errors }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        user_id: orderData.user_id,
        address_id: orderData.address_id,
        subtotal_amount: orderData.subtotal_amount,
        shipping_cost: orderData.shipping_cost,
        total_amount: orderData.total_amount,
        order_status: 'PENDING',
        items: {
          create: orderData.items.map((item) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
            price_at_order: item.price_at_order,
          })),
        },
        discounts: {
          create: orderData.discounts?.map((discount) => ({
            discount_code: discount.discount_code,
            applied_amount: discount.applied_amount,
          })),
        },
        statusHistory: {
          create: {
            old_status: 'PENDING',
            new_status: 'PENDING',
          },
        },
      },
      include: {
        items: true,
        discounts: true,
        statusHistory: true,
      },
    });

    return NextResponse.json({ success: true, order: transformOrder(order) }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json(
      {
        error: 'Error creating order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const order = await prisma.order.findUnique({
        where: { id: Number(id) },
        include: {
          items: {
            include: { variant: { include: { product: true } } },
          },
          discounts: true,
          statusHistory: true,
          user: true,
          address: true,
          payment: true,
        },
      });
      return order
        ? NextResponse.json(transformOrder(order), { status: 200 })
        : NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        discounts: true,
        statusHistory: true,
        user: true,
        address: true,
        payment: true,
      },
    });
    return NextResponse.json(orders.map(transformOrder), { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return NextResponse.json(
      {
        error: 'Error fetching orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

    const updateData = await request.json();

    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(id) },
    });
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        ...updateData,
        order_status: updateData.order_status ? (updateData.order_status.toUpperCase() as OrderStatus) : undefined,
        subtotal_amount: updateData.subtotal_amount !== undefined ? updateData.subtotal_amount : undefined,
        shipping_cost: updateData.shipping_cost !== undefined ? updateData.shipping_cost : undefined,
        total_amount: updateData.total_amount !== undefined ? updateData.total_amount : undefined,
      },
      include: {
        items: true,
        discounts: true,
        statusHistory: true,
      },
    });

    return NextResponse.json({ success: true, order: transformOrder(updatedOrder) }, { status: 200 });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    return NextResponse.json(
      {
        error: 'Error updating order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

    const orderId = Number(id);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    await prisma.orderItem.deleteMany({ where: { order_id: orderId } });
    await prisma.orderDiscount.deleteMany({ where: { order_id: orderId } });
    await prisma.orderStatusHistory.deleteMany({ where: { order_id: orderId } });

    await prisma.order.delete({ where: { id: orderId } });

    return NextResponse.json(
      { success: true, message: 'Order deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    return NextResponse.json(
      {
        error: 'Error deleting order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}