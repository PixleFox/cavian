'use client';
import { useState, useEffect } from 'react';
import React from 'react';

// Define the Discount interface based on your API response
interface Discount {
  id: number;
  code: string;
  percentage: number;
  valid_until: string; // ISO date string
  usage_limit: number;
  created_at: string; // ISO date string
  is_active: boolean;
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch discount codes on mount
  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discounts');
      const data = await response.json();
      setDiscounts(data);
    } catch (error) {
      console.error('خطا در دریافت کدهای تخفیف:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => setShowAddModal(true);
  const handleEdit = (discount: Discount) => {
    setSelectedDiscount(discount);
    setShowEditModal(true);
  };
  const handleDelete = (discount: Discount) => {
    setSelectedDiscount(discount);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedDiscount(null);
  };

  const submitDiscount = async (e: React.FormEvent<HTMLFormElement>, isEdit = false) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement); // Type assertion
    const data = {
      code: formData.get('code') as string,
      percentage: Number(formData.get('percentage')),
      valid_until: formData.get('valid_until') as string,
      usage_limit: Number(formData.get('usage_limit')),
      is_active: formData.get('is_active') === 'on',
    };

    try {
      const url = isEdit ? `/api/discounts?id=${selectedDiscount?.id}` : '/api/discounts';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('خطا در ذخیره کد تخفیف');
      await fetchDiscounts();
      closeModal();
    } catch (error: unknown) {
      const err = error as Error; // Type assertion for error
      console.error('خطا:', err);
      alert(`خطا: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/discounts?id=${selectedDiscount?.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('خطا در حذف کد تخفیف');
      await fetchDiscounts();
      closeModal();
    } catch (error: unknown) {
      const err = error as Error; // Type assertion for error
      console.error('خطا:', err);
      alert(`خطا: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">مدیریت کدهای تخفیف</h2>
      <button
        onClick={handleAdd}
        className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        افزودن کد تخفیف جدید
      </button>

      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-600 bg-gradient-to-br from-gray-800 to-gray-900">
        <table className="w-full text-sm text-right text-gray-300">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100">
            <tr>
              <th className="px-4 py-3">کد</th>
              <th className="px-4 py-3">درصد تخفیف</th>
              <th className="px-4 py-3">تاریخ انقضا</th>
              <th className="px-4 py-3">حد استفاده</th>
              <th className="px-4 py-3">تاریخ ایجاد</th>
              <th className="px-4 py-3">فعال</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500">
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-gray-400">
                  هیچ کد تخفیفی یافت نشد
                </td>
              </tr>
            ) : (
              discounts.map((discount: Discount) => (
                <tr key={discount.id} className="hover:bg-gray-700">
                  <td className="px-4 py-4">{discount.code}</td>
                  <td className="px-4 py-4">{discount.percentage}%</td>
                  <td className="px-4 py-4">{formatDate(discount.valid_until)}</td>
                  <td className="px-4 py-4">{discount.usage_limit}</td>
                  <td className="px-4 py-4">{formatDate(discount.created_at)}</td>
                  <td className="px-4 py-4">{discount.is_active ? 'بله' : 'خیر'}</td>
                  <td className="px-4 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(discount)}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(discount)}
                      className="text-red-400 hover:text-red-600"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-purple-400">
              {showEditModal ? 'ویرایش کد تخفیف' : 'افزودن کد تخفیف'}
            </h3>
            <form onSubmit={(e) => submitDiscount(e, showEditModal)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400">کد</label>
                  <input
                    name="code"
                    defaultValue={selectedDiscount?.code || ''}
                    className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400">درصد تخفیف</label>
                  <input
                    name="percentage"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={selectedDiscount?.percentage || ''}
                    className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400">تاریخ انقضا</label>
                  <input
                    name="valid_until"
                    type="date"
                    defaultValue={
                      selectedDiscount?.valid_until
                        ? new Date(selectedDiscount.valid_until).toISOString().split('T')[0]
                        : ''
                    }
                    className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400">حد استفاده</label>
                  <input
                    name="usage_limit"
                    type="number"
                    min="1"
                    defaultValue={selectedDiscount?.usage_limit || ''}
                    className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400">فعال</label>
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked={selectedDiscount?.is_active ?? true}
                    className="mr-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-400 border border-gray-700 rounded-lg"
                >
                  لغو
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-red-400">تأیید حذف</h3>
            <p className="text-gray-300 mb-6">
              آیا مطمئن هستید که می‌خواهید کد تخفیف &quot;{selectedDiscount?.code}&quot; را حذف کنید؟
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-400 border border-gray-700 rounded-lg"
              >
                لغو
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}