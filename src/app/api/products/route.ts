// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { generateProductCode } from '@/lib/generateProductCode';

// Define interfaces
interface FormFields {
  [key: string]: string | number | File | string[] | undefined;
  name?: string;
  description?: string;
  material?: string;
  gender?: string;
  type?: string;
  sleeve_type?: string;
  collar_type?: string;
  discount_percent?: string;
  category_ids?: string; // Single string or JSON string
  variants?: string; // JSON string of variants
  mainImageIndex?: string;
}

interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  price: number;
}

interface ProductImage {
  image_url: string;
  is_main_image: boolean;
}

// Helper function to parse FormData
async function parseFormData(request: Request): Promise<{ fields: FormFields; images: ProductImage[] }> {
  const formData = await request.formData();
  const fields: FormFields = {};
  const files: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files.push(value);
    } else {
      fields[key] = value.toString();
    }
  }

  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const mainImageIndex = fields.mainImageIndex ? parseInt(fields.mainImageIndex, 10) : 0;

  const images = await Promise.all(
    files.map(async (file, index) => {
      const fileName = `${Date.now()}-${index}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
      return {
        image_url: `/uploads/${fileName}`,
        is_main_image: index === mainImageIndex,
      };
    })
  );

  let categoryIds: number[] = [];
  if (fields.category_ids) {
    try {
      const parsedIds = JSON.parse(fields.category_ids);
      categoryIds = Array.isArray(parsedIds) ? parsedIds.map(id => Number(id)) : [Number(parsedIds)];
    } catch (e) {
      console.error('Failed to parse category_ids:', e);
      categoryIds = [];
    }
  }
  fields.category_ids = categoryIds.length > 0 ? JSON.stringify(categoryIds) : undefined;

  return { fields, images };
}

// POST: Create a new product
export async function POST(request: Request) {
  try {
    const { fields, images } = await parseFormData(request);

    const errors: Record<string, string> = {};
    if (!fields.name) errors.name = 'نام محصول الزامی است';
    if (!fields.description) errors.description = 'توضیحات محصول الزامی است';
    if (!fields.material) errors.material = 'جنس محصول الزامی است';
    else if (!['نخ پنبه', 'اسپان', 'ترکیبی', 'فلامنت', 'جودون', 'ویسکوز', 'ملانژ'].includes(fields.material)) {
      errors.material = 'جنس محصول باید یکی از مقادیر معتبر باشد';
    }
    if (!fields.gender) errors.gender = 'جنسیت الزامی است';
    else if (!['MALE', 'FEMALE', 'UNISEX'].includes(fields.gender)) {
      errors.gender = 'جنسیت باید یکی از مقادیر MALE، FEMALE یا UNISEX باشد';
    }
    if (!fields.type) errors.type = 'نوع محصول الزامی است';
    else if (!['T_SHIRT', 'ACCESSORIES'].includes(fields.type)) {
      errors.type = 'نوع محصول باید T_SHIRT یا ACCESSORIES باشد';
    }
    if (!fields.sleeve_type) errors.sleeve_type = 'نوع آستین الزامی است';
    else if (!['SHORT', 'LONG', 'SLEEVELESS'].includes(fields.sleeve_type)) {
      errors.sleeve_type = 'نوع آستین باید SHORT، LONG یا SLEEVELESS باشد';
    }
    if (!fields.collar_type) errors.collar_type = 'نوع یقه الزامی است';
    else if (!['CIRCLE', 'SEVEN', 'COLLARED'].includes(fields.collar_type)) {
      errors.collar_type = 'نوع یقه باید CIRCLE، SEVEN یا COLLARED باشد';
    }

    const categoryIds = fields.category_ids ? (JSON.parse(fields.category_ids) as number[]) : [];
    if (categoryIds.length === 0) errors.category_ids = 'انتخاب یک دسته‌بندی الزامی است';

    const variants = fields.variants ? (JSON.parse(fields.variants) as ProductVariant[]) : [];
    if (variants.length === 0) errors.variants = 'حداقل یک متغیر الزامی است';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'خطا در داده‌های ورودی', details: errors }, { status: 400 });
    }

    let productCode = '';
    let isCodeUnique = false;

    while (!isCodeUnique) {
      productCode = generateProductCode();
      const existingProduct = await prisma.product.findUnique({
        where: { product_code: productCode },
      });
      if (!existingProduct) isCodeUnique = true;
    }

    const product = await prisma.product.create({
      data: {
        name: fields.name!,
        description: fields.description!,
        material: fields.material!,
        gender: fields.gender as 'MALE' | 'FEMALE' | 'UNISEX',
        type: fields.type as 'T_SHIRT' | 'ACCESSORIES',
        sleeve_type: fields.sleeve_type as 'SHORT' | 'LONG' | 'SLEEVELESS',
        collar_type: fields.collar_type as 'CIRCLE' | 'SEVEN' | 'COLLARED',
        product_code: productCode,
        discount_percent: fields.discount_percent ? parseFloat(fields.discount_percent) : 0,
        categories: { connect: categoryIds.map(id => ({ id: Number(id) })) },
      },
    });

    if (variants.length > 0) {
      await prisma.productVariant.createMany({
        data: variants.map(variant => ({
          productId: product.id,
          size: variant.size,
          color: variant.color,
          stock: Number(variant.stock),
          price: Number(variant.price),
          sku: `${productCode}${variant.size}${variant.color.replace(/\s+/g, '')}`,
        })),
      });
    }

    if (images.length > 0) {
      await prisma.productImage.createMany({
        data: images.map(image => ({
          productId: product.id,
          image_url: image.image_url,
          is_main_image: image.is_main_image,
        })),
      });
    }

    return NextResponse.json({ success: true, productId: product.id }, { status: 201 });
  } catch (error) {
    console.error('❌ خطا در ایجاد محصول:', error);
    return NextResponse.json(
      {
        error: 'خطا در ایجاد محصول',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: Fetch products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const product = await prisma.product.findUnique({
        where: { id: Number(id) },
        include: { variants: true, images: true, categories: true },
      });
      return product
        ? NextResponse.json(product, { status: 200 })
        : NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      include: { variants: true, images: true, categories: true },
    });
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('❌ خطا در دریافت محصولات:', error);
    return NextResponse.json(
      {
        error: 'خطا در دریافت محصولات',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT: Update product
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه محصول الزامی است' }, { status: 400 });

    const { fields, images } = await parseFormData(request);
    const productId = Number(id);

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true, images: true, categories: true },
    });
    if (!existingProduct) {
      return NextResponse.json({ error: 'محصول با این شناسه یافت نشد' }, { status: 404 });
    }

    const errors: Record<string, string> = {};
    if (!fields.name) errors.name = 'نام محصول الزامی است';
    if (!fields.description) errors.description = 'توضیحات محصول الزامی است';
    if (!fields.material) errors.material = 'جنس محصول الزامی است';
    else if (!['نخ پنبه', 'اسپان', 'ترکیبی', 'فلامنت', 'جودون', 'ویسکوز', 'ملانژ'].includes(fields.material)) {
      errors.material = 'جنس محصول باید یکی از مقادیر معتبر باشد';
    }
    if (!fields.gender) errors.gender = 'جنسیت الزامی است';
    else if (!['MALE', 'FEMALE', 'UNISEX'].includes(fields.gender)) {
      errors.gender = 'جنسیت باید یکی از مقادیر MALE، FEMALE یا UNISEX باشد';
    }
    if (!fields.type) errors.type = 'نوع محصول الزامی است';
    else if (!['T_SHIRT', 'ACCESSORIES'].includes(fields.type)) {
      errors.type = 'نوع محصول باید T_SHIRT یا ACCESSORIES باشد';
    }
    if (!fields.sleeve_type) errors.sleeve_type = 'نوع آستین الزامی است';
    else if (!['SHORT', 'LONG', 'SLEEVELESS'].includes(fields.sleeve_type)) {
      errors.sleeve_type = 'نوع آستین باید SHORT، LONG یا SLEEVELESS باشد';
    }
    if (!fields.collar_type) errors.collar_type = 'نوع یقه الزامی است';
    else if (!['CIRCLE', 'SEVEN', 'COLLARED'].includes(fields.collar_type)) {
      errors.collar_type = 'نوع یقه باید CIRCLE، SEVEN یا COLLARED باشد';
    }

    const categoryIds = fields.category_ids ? (JSON.parse(fields.category_ids) as number[]) : [];
    if (categoryIds.length === 0) errors.category_ids = 'انتخاب یک دسته‌بندی الزامی است';

    const variants = fields.variants ? (JSON.parse(fields.variants) as ProductVariant[]) : [];
    if (variants.length === 0) errors.variants = 'حداقل یک متغیر الزامی است';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'خطا در داده‌های ورودی', details: errors }, { status: 400 });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: fields.name!,
        description: fields.description!,
        material: fields.material!,
        gender: fields.gender as 'MALE' | 'FEMALE' | 'UNISEX',
        type: fields.type as 'T_SHIRT' | 'ACCESSORIES',
        sleeve_type: fields.sleeve_type as 'SHORT' | 'LONG' | 'SLEEVELESS',
        collar_type: fields.collar_type as 'CIRCLE' | 'SEVEN' | 'COLLARED',
        discount_percent: fields.discount_percent ? parseFloat(fields.discount_percent) : 0,
        categories: { set: [], connect: categoryIds.map(id => ({ id: Number(id) })) },
      },
    });

    // Fetch existing variants and check for OrderItems
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId },
      include: { orderItems: true },
    });

    // Delete only variants that have no OrderItems
    const variantsToDelete = existingVariants
      .filter(variant => variant.orderItems.length === 0)
      .map(variant => variant.id);

    if (variantsToDelete.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { id: { in: variantsToDelete } },
      });
    }

    // Update or create new variants
    if (variants.length > 0) {
      const variantData = variants.map(variant => ({
        productId,
        size: variant.size,
        color: variant.color,
        stock: Number(variant.stock),
        price: Number(variant.price),
        sku: `${existingProduct.product_code}${variant.size}${variant.color.replace(/\s+/g, '')}`,
      }));

      // Check for existing variants that can’t be deleted (due to OrderItems)
      const preservedVariants = existingVariants.filter(v => v.orderItems.length > 0);
      for (const variant of variantData) {
        const existing = preservedVariants.find(
          v => v.size === variant.size && v.color === variant.color
        );
        if (existing) {
          // Update existing variant instead of recreating
          await prisma.productVariant.update({
            where: { id: existing.id },
            data: {
              stock: variant.stock,
              price: variant.price,
            },
          });
        } else {
          // Create new variant
          await prisma.productVariant.create({ data: variant });
        }
      }
    }

    // Update images
    if (images.length > 0) {
      const existingImages = await prisma.productImage.findMany({ where: { productId } });
      await Promise.all(
        existingImages.map(img =>
          fs.unlink(path.join(process.cwd(), 'public', img.image_url)).catch(console.error)
        )
      );
      await prisma.productImage.deleteMany({ where: { productId } });
      await prisma.productImage.createMany({
        data: images.map(image => ({
          productId,
          image_url: image.image_url,
          is_main_image: image.is_main_image,
        })),
      });
    }

    return NextResponse.json({ success: true, productId: updatedProduct.id }, { status: 200 });
  } catch (error) {
    console.error('❌ خطا در به‌روزرسانی محصول:', error);
    return NextResponse.json(
      {
        error: 'خطا در به‌روزرسانی محصول',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove product
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'شناسه محصول الزامی است' }, { status: 400 });

    const productId = Number(id);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'محصول با این شناسه یافت نشد' }, { status: 404 });

    // Check if product has variants tied to OrderItems
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      include: { orderItems: true },
    });
    if (variants.some(v => v.orderItems.length > 0)) {
      return NextResponse.json(
        { error: 'نمی‌توان محصول را حذف کرد زیرا به سفارشات مرتبط است' },
        { status: 400 }
      );
    }

    await prisma.productVariant.deleteMany({ where: { productId } });

    const images = await prisma.productImage.findMany({ where: { productId } });
    await Promise.all(
      images.map(img =>
        fs.unlink(path.join(process.cwd(), 'public', img.image_url)).catch(console.error)
      )
    );
    await prisma.productImage.deleteMany({ where: { productId } });

    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json(
      { success: true, message: 'محصول با موفقیت حذف شد' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ خطا در حذف محصول:', error);
    return NextResponse.json(
      {
        error: 'خطا در حذف محصول',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}