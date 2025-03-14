'use client';
import React from 'react'; // Added import for React
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Validation Schema
const schema = yup.object().shape({
  name: yup.string().required('نام محصول الزامی است'),
  description: yup.string().required('توضیحات الزامی است'),
  material: yup
    .string()
    .oneOf(['نخ پنبه', 'اسپان', 'ترکیبی', 'فلامنت', 'جودون', 'ویسکوز', 'ملانژ'])
    .required('جنس محصول الزامی است'),
  gender: yup.string().oneOf(['MALE', 'FEMALE', 'UNISEX']).required('جنسیت الزامی است'),
  type: yup.string().oneOf(['T_SHIRT', 'ACCESSORIES']).required('نوع محصول الزامی است'),
  sleeve_type: yup.string().oneOf(['SHORT', 'LONG', 'SLEEVELESS']).required('نوع آستین الزامی است'),
  collar_type: yup.string().oneOf(['CIRCLE', 'SEVEN', 'COLLARED']).required('نوع یقه الزامی است'),
  discount_percent: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .min(0, 'درصد تخفیف نمی‌تواند کمتر از ۰ باشد')
    .max(100, 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد'),
  category_ids: yup.string().required('انتخاب یک دسته‌بندی الزامی است'),
  variants: yup.array().of(
    yup.object().shape({
      size: yup
        .string()
        .oneOf(['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL'])
        .required('سایز الزامی است'),
      color: yup.string().required('رنگ الزامی است'),
      stock: yup.number().min(0, 'موجودی نمی‌تواند منفی باشد').required('موجودی الزامی است'),
      price: yup.number().min(0, 'قیمت نمی‌تواند منفی باشد').required('قیمت الزامی است'),
    })
  ),
});

// Product interface based on schema
interface Product {
  id?: number;
  name: string;
  description: string;
  material: 'نخ پنبه' | 'اسپان' | 'ترکیبی' | 'فلامنت' | 'جودون' | 'ویسکوز' | 'ملانژ';
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  type: 'T_SHIRT' | 'ACCESSORIES';
  sleeve_type: 'SHORT' | 'LONG' | 'SLEEVELESS';
  collar_type: 'CIRCLE' | 'SEVEN' | 'COLLARED';
  discount_percent: number | null;
  category_ids: string[];
  variants: {
    size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | '4XL';
    color: string;
    stock: number;
    price: number;
  }[];
}

// Category interface for API response
interface Category {
  id: number;
  category_name: string;
}

// Props interface
interface ProductFormProps {
  onClose: () => void;
  refreshProducts?: () => void; // Made optional
  product?: Product | null;
}

// Formatting and parsing functions
const formatPrice = (value: number | string) => {
  if (!value && value !== 0) return '';
  return `${Number(value).toLocaleString('fa-IR')} تومان`;
};

const parsePrice = (value: string) => {
  if (!value) return 0;
  const cleanedValue = value.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, (d: string) =>
    '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()
  );
  return Number(cleanedValue) || 0;
};

export default function ProductForm({ onClose, refreshProducts, product = null }: ProductFormProps) {
  const isEditMode = !!product;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setError,
    setValue,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      material: undefined as 'نخ پنبه' | 'اسپان' | 'ترکیبی' | 'فلامنت' | 'جودون' | 'ویسکوز' | 'ملانژ' | undefined,
      gender: undefined as 'MALE' | 'FEMALE' | 'UNISEX' | undefined,
      type: undefined as 'T_SHIRT' | 'ACCESSORIES' | undefined,
      sleeve_type: undefined as 'SHORT' | 'LONG' | 'SLEEVELESS' | undefined,
      collar_type: undefined as 'CIRCLE' | 'SEVEN' | 'COLLARED' | undefined,
      discount_percent: null,
      category_ids: '',
      variants: [{ size: 'S', color: '', stock: 0, price: 0 }],
    },
  });

  const { fields: variantFields, append: addVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  const [images, setImages] = useState<File[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceInputs, setPriceInputs] = useState<{ [key: number]: string }>({ 0: formatPrice(0) });

  // Reset form based on product prop
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        material: product.material,
        gender: product.gender,
        type: product.type,
        sleeve_type: product.sleeve_type,
        collar_type: product.collar_type,
        discount_percent: product.discount_percent,
        category_ids: product.category_ids?.[0] || '',
        variants: product.variants.length > 0
          ? product.variants.map((v) => ({
              size: v.size,
              color: v.color,
              stock: v.stock,
              price: v.price,
            }))
          : [{ size: 'S', color: '', stock: 0, price: 0 }],
      });
      const initialPrices: { [key: number]: string } = {};
      product.variants.forEach((v, index) => {
        initialPrices[index] = formatPrice(v.price);
      });
      setPriceInputs(initialPrices);
    } else {
      reset({
        name: '',
        description: '',
        material: undefined as 'نخ پنبه' | 'اسپان' | 'ترکیبی' | 'فلامنت' | 'جودون' | 'ویسکوز' | 'ملانژ' | undefined,
        gender: undefined as 'MALE' | 'FEMALE' | 'UNISEX' | undefined,
        type: undefined as 'T_SHIRT' | 'ACCESSORIES' | undefined,
        sleeve_type: undefined as 'SHORT' | 'LONG' | 'SLEEVELESS' | undefined,
        collar_type: undefined as 'CIRCLE' | 'SEVEN' | 'COLLARED' | undefined,
        discount_percent: null,
        category_ids: '',
        variants: [{ size: 'S', color: '', stock: 0, price: 0 }],
      });
      setImages([]);
      setMainImageIndex(null);
      setPriceInputs({ 0: formatPrice(0) });
    }
  }, [product, reset]);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/productcategories')
      .then((res) => res.json())
      .then((data: Category[]) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error('دسته‌بندی‌ها به صورت آرایه دریافت نشد:', data);
        }
      })
      .catch((err: Error) => console.error('خطا در دریافت دسته‌بندی‌ها:', err));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      setImages((prevImages) => {
        const newImages = [...prevImages, ...files];
        if (mainImageIndex === null && files.length > 0) {
          setMainImageIndex(prevImages.length);
        }
        return newImages;
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (mainImageIndex !== null) {
      if (mainImageIndex === index) {
        setMainImageIndex(null);
      } else if (mainImageIndex > index) {
        setMainImageIndex(mainImageIndex - 1);
      }
    }
  };

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  const handlePriceChange = (index: number, value: string) => {
    const rawValue = parsePrice(value);
    setValue(`variants.${index}.price`, rawValue, { shouldValidate: true });
    setPriceInputs((prev) => ({
      ...prev,
      [index]: formatPrice(rawValue),
    }));
  };

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const formData = new FormData();
      images.forEach((image: File, index: number) => {
        formData.append('images', image);
        if (index === mainImageIndex) {
          formData.append('mainImageIndex', index.toString());
        }
      });

      const variantsWithRawPrices = (data.variants || []).map((variant) => ({
        ...variant,
        price: Number(variant.price),
      }));

      Object.entries({ ...data, variants: variantsWithRawPrices }).forEach(([key, value]) => {
        if (key === 'category_ids') {
          formData.append(key, JSON.stringify([value]));
        } else if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      const url = isEditMode ? `/api/products?id=${product?.id}` : '/api/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        if (result.details && typeof result.details === 'object') {
          Object.entries(result.details).forEach(([field, message]: [string, unknown]) => {
            setError(field as keyof yup.InferType<typeof schema>, {
              type: 'server',
              message: String(message),
            });
          });
        } else {
          throw new Error(result.error || 'خطا در ذخیره محصول');
        }
        return;
      }

      if (result.success) {
        reset();
        setImages([]);
        setMainImageIndex(null);
        setPriceInputs({ 0: formatPrice(0) });
        refreshProducts?.(); // Optional chaining to handle if not provided
        onClose();
      }
    } catch (error: unknown) {
      const err = error as Error;
      alert(`خطا: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6 text-center text-purple-400">
          {isEditMode ? 'ویرایش محصول' : 'فرم محصول جدید'}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">نام محصول</label>
            <input {...register('name')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg" />
            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
          </div>
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-400">توضیحات</label>
            <textarea
              {...register('description')}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg min-h-[100px]"
            />
            {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">جنس محصول</label>
            <select {...register('material')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg">
              <option value="">انتخاب کنید</option>
              <option value="نخ پنبه">نخ پنبه</option>
              <option value="اسپان">اسپان</option>
              <option value="ترکیبی">ترکیبی</option>
              <option value="فلامنت">فلامنت</option>
              <option value="جودون">جودون</option>
              <option value="ویسکوز">ویسکوز</option>
              <option value="ملانژ">ملانژ</option>
            </select>
            {errors.material && <span className="text-red-500 text-sm">{errors.material.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">درصد تخفیف</label>
            <input
              type="number"
              {...register('discount_percent')}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg"
            />
            {errors.discount_percent && <span className="text-red-500 text-sm">{errors.discount_percent.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">جنسیت</label>
            <select {...register('gender')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg">
              <option value="">انتخاب کنید</option>
              <option value="MALE">مردانه</option>
              <option value="FEMALE">زنانه</option>
              <option value="UNISEX">مشترک</option>
            </select>
            {errors.gender && <span className="text-red-500 text-sm">{errors.gender.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">نوع محصول</label>
            <select {...register('type')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg">
              <option value="">انتخاب کنید</option>
              <option value="T_SHIRT">تیشرت</option>
              <option value="ACCESSORIES">اکسسوری</option>
            </select>
            {errors.type && <span className="text-red-500 text-sm">{errors.type.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">نوع آستین</label>
            <select {...register('sleeve_type')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg">
              <option value="">انتخاب کنید</option>
              <option value="SHORT">کوتاه</option>
              <option value="LONG">بلند</option>
              <option value="SLEEVELESS">بدون آستین</option>
            </select>
            {errors.sleeve_type && <span className="text-red-500 text-sm">{errors.sleeve_type.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">نوع یقه</label>
            <select {...register('collar_type')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg">
              <option value="">انتخاب کنید</option>
              <option value="CIRCLE">گرد</option>
              <option value="SEVEN">هفت</option>
              <option value="COLLARED">یقه‌دار</option>
            </select>
            {errors.collar_type && <span className="text-red-500 text-sm">{errors.collar_type.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">دسته‌بندی</label>
            <select
              {...register('category_ids')}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="">انتخاب کنید</option>
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
            {errors.category_ids && <span className="text-red-500 text-sm">{errors.category_ids.message}</span>}
          </div>
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-400">تصاویر محصول</label>
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg"
            />
            <div className="flex flex-wrap gap-4 mt-2">
              {images.map((img: File, index: number) => (
                <div key={index} className="relative w-24 h-24">
                  <Image
                    src={URL.createObjectURL(img)}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-lg border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white px-1.5 py-0.5 text-xs rounded-bl-lg"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsMainImage(index)}
                    className={`absolute bottom-0 left-0 px-2 py-1 text-xs rounded-tr-lg ${
                      mainImageIndex === index ? 'bg-green-500' : 'bg-gray-500 hover:bg-gray-600'
                    } text-white`}
                  >
                    {mainImageIndex === index ? 'تصویر اصلی' : 'انتخاب اصلی'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-2 space-y-2">
            <h4 className="text-lg font-bold text-gray-400">متغیرها</h4>
            {variantFields.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 p-4 bg-gray-800 rounded-lg"
              >
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">سایز</label>
                  <select
                    {...register(`variants.${index}.size`)}
                    className="w-full p-2 border border-gray-700 bg-gray-900 rounded-lg"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="XXXL">XXXL</option>
                    <option value="4XL">4XL</option>
                  </select>
                  {errors.variants?.[index]?.size && (
                    <span className="text-red-500 text-sm">{errors.variants[index].size?.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">رنگ</label>
                  <input
                    {...register(`variants.${index}.color`)}
                    className="w-full p-2 border border-gray-700 bg-gray-900 rounded-lg"
                  />
                  {errors.variants?.[index]?.color && (
                    <span className="text-red-500 text-sm">{errors.variants[index].color?.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">موجودی</label>
                  <input
                    type="number"
                    {...register(`variants.${index}.stock`)}
                    className="w-full p-2 border border-gray-700 bg-gray-900 rounded-lg"
                  />
                  {errors.variants?.[index]?.stock && (
                    <span className="text-red-500 text-sm">{errors.variants[index].stock?.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">قیمت</label>
                  <input
                    type="text"
                    value={priceInputs[index] || formatPrice(getValues(`variants.${index}.price`) || 0)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange(index, e.target.value)}
                    className="w-full p-2 border border-gray-700 bg-gray-900 rounded-lg text-left"
                  />
                  {errors.variants?.[index]?.price && (
                    <span className="text-red-500 text-sm">{errors.variants[index].price?.message}</span>
                  )}
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      removeVariant(index);
                      setPriceInputs((prev) => {
                        const newPrices = { ...prev };
                        delete newPrices[index];
                        return newPrices;
                      });
                    }}
                    className="w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                addVariant({ size: 'S', color: '', stock: 0, price: 0 });
                setPriceInputs((prev) => ({
                  ...prev,
                  [variantFields.length]: formatPrice(0),
                }));
              }}
              className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              افزودن متغیر جدید
            </button>
          </div>
          <div className="col-span-2 flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-red-400 hover:text-white border border-gray-700 rounded-lg"
            >
              لغو
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'در حال ذخیره...' : isEditMode ? 'به‌روزرسانی محصول' : 'ذخیره محصول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}