// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the interface for the category data
interface CategoryData {
  category_name: string;
}

// POST: Add new categories
export async function POST() {
  try {
    // Define the list of categories you want to add
    const categoriesToAdd: CategoryData[] = [
      { category_name: 'بازی' },
      { category_name: 'فیلم و سریال' },
      { category_name: 'موسیقی' },
      { category_name: 'انتزاعی' },
      { category_name: 'نوستالژی' },
      { category_name: 'تاریخی' },
      { category_name: 'میم' },
      { category_name: 'انیمه' },
      { category_name: 'ترند' },
    ];

    // Create the categories in the database
    const createdCategories = await prisma.productCategory.createMany({
      data: categoriesToAdd,
      skipDuplicates: true, // Skip if a category with the same name already exists
    });

    return NextResponse.json(
      { success: true, message: 'دسته‌بندی‌ها با موفقیت اضافه شدند', createdCategories },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error adding categories:', error);
    return NextResponse.json(
      {
        error: 'خطا در اضافه کردن دسته‌بندی‌ها',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: Fetch all product categories
export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
      select: {
        id: true,
        category_name: true,
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('❌ Error fetching product categories:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی‌ها', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}