'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import Image from 'next/image';

// Define Variant interface
interface Variant {
  id: number;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | '4XL';
  color: string;
  stock: number;
  price: number;
  sku: string;
}

// Define ProductImage interface based on Prisma schema
interface ProductImage {
  id: number;
  image_url: string;
  is_main_image: boolean;
}

// Updated Product interface to include images
interface Product {
  id: number;
  name: string;
  product_code: string;
  description: string;
  material: 'نخ پنبه' | 'اسپان' | 'ترکیبی' | 'فلامنت' | 'جودون' | 'ویسکوز' | 'ملانژ';
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  type: 'T_SHIRT' | 'ACCESSORIES';
  sleeve_type: 'SHORT' | 'LONG' | 'SLEEVELESS';
  collar_type: 'CIRCLE' | 'SEVEN' | 'COLLARED';
  discount_percent: number | null;
  category_ids: string[];
  variants: Variant[];
  images: ProductImage[];
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
}

// Helper function to get the main image URL
const getMainImageUrl = (images: ProductImage[]): string | null => {
  const mainImage = images.find((img) => img.is_main_image);
  return mainImage ? mainImage.image_url : null;
};

// Persian translations
const getPersianGender = (gender: 'MALE' | 'FEMALE' | 'UNISEX') => {
  switch (gender) {
    case 'MALE':
      return 'مردانه';
    case 'FEMALE':
      return 'زنانه';
    case 'UNISEX':
      return 'مشترک';
    default:
      return gender;
  }
};

const getProductType = (type: 'T_SHIRT' | 'ACCESSORIES') => {
  switch (type) {
    case 'T_SHIRT':
      return 'تیشرت';
    case 'ACCESSORIES':
      return 'اکسسوری';
    default:
      return type;
  }
};

// Format price in Persian
const formatPrice = (value: number | string) => {
  if (!value && value !== 0) return '';
  return `${Number(value).toLocaleString('fa-IR')} تومان`;
};

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ field: string | null; order: 'asc' | 'desc' | null }>({
    field: null,
    order: null,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDelete = (productId: number) => {
    setProductToDelete(productId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products?id=${productToDelete}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در حذف محصول');
      }

      onDelete(productToDelete);
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('خطا در حذف محصول:', error);
      alert(`خطا: ${error instanceof Error ? error.message : 'یک خطای ناشناخته رخ داد'}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>, product: Product) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event bubbling
    onEdit(product); // Trigger parent’s onEdit to show the form
  };

  const toggleRow = (productId: number) => {
    setExpandedRows((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev.field === field && prev.order === 'asc') {
        return { field, order: 'desc' };
      } else if (prev.field === field && prev.order === 'desc') {
        return { field: null, order: null };
      } else {
        return { field, order: 'asc' };
      }
    });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (!sortConfig.field || !sortConfig.order) return 0;

    let comparison = 0;
    switch (sortConfig.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'product_code':
        comparison = a.product_code.localeCompare(b.product_code);
        break;
      case 'discount_percent':
        comparison = (a.discount_percent || 0) - (b.discount_percent || 0);
        break;
      case 'gender':
        comparison = a.gender.localeCompare(b.gender);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'material':
        comparison = a.material.localeCompare(b.material);
        break;
      default:
        comparison = 0;
    }
    return sortConfig.order === 'asc' ? comparison : -comparison;
  });

  const getSortIndicator = (field: string) => {
    if (sortConfig.field !== field) return '↕';
    return sortConfig.order === 'asc' ? '↑' : '↓';
  };

  return (
    <>
      <div
        className={`overflow-x-auto rounded-xl shadow-lg border transition-opacity duration-500`}
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-elevated)',
          opacity: isMounted ? 1 : 0,
        }}
      >
        <table
          className="w-full text-sm text-right"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
        >
          <thead
            className="text-sm"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--text-primary)' }}
          >
            <tr>
              <th className="px-4 py-3 font-medium">تصویر</th>
              <th
                className="px-4 py-3 font-medium cursor-pointer transition-colors hover:text-[var(--accent)]"
                onClick={() => handleSort('name')}
              >
                نام محصول {getSortIndicator('name')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer transition-colors hover:text-[var(--accent)]"
                onClick={() => handleSort('product_code')}
              >
                کد محصول {getSortIndicator('product_code')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer transition-colors hover:text-[var(--accent)]"
                onClick={() => handleSort('gender')}
              >
                جنسیت {getSortIndicator('gender')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer transition-colors hover:text-[var(--accent)]"
                onClick={() => handleSort('type')}
              >
                نوع {getSortIndicator('type')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer transition-colors hover:text-[var(--accent)]"
                onClick={() => handleSort('material')}
              >
                جنس {getSortIndicator('material')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer transition-colors hover:text-[var(--accent)]"
                onClick={() => handleSort('discount_percent')}
              >
                تخفیف {getSortIndicator('discount_percent')}
              </th>
              <th className="px-4 py-3 font-medium">'گاییدن'</th>
              <th className="px-4 py-3 font-medium">متغیرها</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {sortedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-4 text-center"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  هیچ محصولی یافت نشد
                </td>
              </tr>
            ) : (
              sortedProducts.map((product) => (
                <React.Fragment key={product.id}>
                  <tr
                    className="transition-all duration-200 ease-in-out hover:bg-[var(--bg-base)] hover:scale-[1.01]"
                  >
                    <td className="px-4 py-4">
                      {getMainImageUrl(product.images) ? (
                        <Image
                          src={getMainImageUrl(product.images)!}
                          alt={product.name}
                          width={48} // Match w-12 (3rem = 48px)
                          height={48} // Match h-12 (3rem = 48px)
                          className="object-cover rounded-md shadow-sm"
                          style={{ borderColor: 'var(--border)' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-md flex items-center justify-center"
                          style={{
                            backgroundColor: 'var(--bg-base)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          بدون تصویر
                        </div>
                      )}
                    </td>
                    <td
                      className="px-4 py-4 font-medium max-w-[200px] truncate"
                      style={{ color: 'var(--text-primary)' }}
                      title={product.name}
                    >
                      {product.name}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--text-secondary)' }}>
                      {product.product_code}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--text-secondary)' }}>
                      {getPersianGender(product.gender)}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--text-secondary)' }}>
                      {getProductType(product.type)}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--text-secondary)' }}>
                      {product.material}
                    </td>
                    <td className="px-4 py-4" style={{ color: 'var(--text-secondary)' }}>
                      {product.discount_percent ? `${product.discount_percent}%` : '-'}
                    </td>
                    <td className="px-4 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={(e) => handleEditClick(e, product)}
                        className="transition-all duration-200 hover:scale-110"
                        style={{ color: 'var(--primary)' }}
                        title="ویرایش"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="transition-all duration-200 hover:scale-110"
                        style={{ color: 'var(--error)' }}
                        title="حذف"
                      >
                        <FaTrash />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleRow(product.id)}
                        className="transition-all duration-200 hover:scale-110"
                        style={{ color: 'var(--accent)' }}
                        title={expandedRows.includes(product.id) ? 'مخفی کردن' : 'نمایش'}
                      >
                        {expandedRows.includes(product.id) ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.includes(product.id) && (
                    <tr
                      className="animate-slide-down"
                      style={{ backgroundColor: 'var(--bg-base)' }}
                    >
                      <td colSpan={9} className="px-6 py-4">
                        <div style={{ color: 'var(--text-primary)' }}>
                          <h4
                            className="font-medium mb-4"
                            style={{ color: 'var(--primary)' }}
                          >
                            متغیرهای محصول
                          </h4>
                          {product.variants.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>
                              هیچ متغیری برای این محصول وجود ندارد
                            </p>
                          ) : (
                            <table
                              className="w-full text-sm text-right rounded-lg overflow-hidden"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <thead
                                style={{
                                  backgroundColor: 'var(--bg-elevated)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                <tr>
                                  <th className="px-4 py-2">سایز</th>
                                  <th className="px-4 py-2">رنگ</th>
                                  <th className="px-4 py-2">موجودی</th>
                                  <th className="px-4 py-2">قیمت</th>
                                  <th className="px-4 py-2">SKU</th>
                                </tr>
                              </thead>
                              <tbody style={{ borderColor: 'var(--border)' }}>
                                {product.variants.map((variant) => (
                                  <tr
                                    key={variant.id}
                                    className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                                  >
                                    <td className="px-4 py-2">{variant.size}</td>
                                    <td className="px-4 py-2">{variant.color}</td>
                                    <td className="px-4 py-2">{variant.stock}</td>
                                    <td className="px-4 py-2">{formatPrice(variant.price)}</td>
                                    <td className="px-4 py-2">{variant.sku}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }} // --bg-base with opacity
        >
          <div
            className="rounded-xl shadow-2xl p-6 w-full max-w-md animate-bounce-in"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              borderWidth: '1px',
            }}
          >
            <h3
              className="text-lg font-medium mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              تأیید حذف محصول
            </h3>
            <p
              className="mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟ این عملیات قابل بازگشت نیست!
            </p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg transition-all duration-200 glow-button"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                }}
                disabled={loading}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg transition-all duration-200 glow-button"
                style={{
                  backgroundColor: 'var(--error)',
                  color: 'var(--text-primary)',
                }}
                disabled={loading}
              >
                {loading ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}