'use client';
import React, { useState, useEffect } from 'react';
import { BarLoader } from 'react-spinners';
import {
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  ArchiveBoxIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export interface OrderItem {
  id: number;
  variant_id: number;
  quantity: number;
  price_at_order: number;
  variant: { product: { name: string } };
}

export interface OrderAddress {
  street: string;
  city: string;
  state_province: string | null;
  postal_code: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'under_consideration';

export interface Order {
  id: number;
  user_id: number;
  address: OrderAddress;
  subtotal_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_method_id: number | null;
  transaction_id: number | null;
  order_status: OrderStatus;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface OrdersTableProps {
  orders: Order[];
  onStatusUpdate: (orderId: number, newStatus: OrderStatus) => void;
  onDelete: (orderId: number) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders = [], onStatusUpdate, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ field: string | null; order: 'asc' | 'desc' | null }>({
    field: null,
    order: null,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, [orders]);

  const handleDelete = (orderId: number) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete || loading) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/orders?id=${orderToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'خطا در حذف سفارش');
      }
      onDelete(orderToDelete);
      setShowDeleteModal(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('خطا در حذف سفارش:', error);
      setErrorMessage((error as Error).message || 'یک خطای ناشناخته رخ داد');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
    setErrorMessage(null);
  };

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_status: newStatus }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'خطا در به‌روزرسانی وضعیت');
      }
      onStatusUpdate(orderId, newStatus);
    } catch (error) {
      console.error('خطا در به‌روزرسانی وضعیت:', error);
      setErrorMessage((error as Error).message || 'یک خطای ناشناخته رخ داد');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (orderId: number) => {
    setExpandedRows((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
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

  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortConfig.field || !sortConfig.order) return 0;

    let comparison = 0;
    switch (sortConfig.field) {
      case 'id':
        comparison = a.id - b.id;
        break;
      case 'total_amount':
        comparison = (a.total_amount || 0) - (b.total_amount || 0);
        break;
      case 'created_at':
        comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        break;
      case 'status':
        comparison = (a.order_status || '').localeCompare(b.order_status || '');
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

  const getPersianStatus = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'در انتظار بررسی';
      case 'processing': return 'در حال پردازش';
      case 'shipped': return 'ارسال شده';
      case 'delivered': return 'تحویل داده شده';
      case 'cancelled': return 'لغو شده';
      case 'under_consideration': return 'در حال بررسی';
      default: return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'var(--yellow)';
      case 'processing': return 'var(--primary)';
      case 'shipped': return 'var(--accent)';
      case 'delivered': return 'var(--success)';
      case 'cancelled': return 'var(--error)';
      case 'under_consideration': return 'var(--orange)';
      default: return 'var(--text-secondary)';
    }
  };

  const formatPrice = (value: number | string) => {
    if (!value && value !== 0) return '';
    return `${Number(value).toLocaleString('fa-IR')} تومان`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <p className="text-2xl font-bold mb-6 text-gray-100">سفارشات </p>
      <div
        className="overflow-x-auto rounded-xl shadow-lg border bg-[var(--bg-elevated)] transition-opacity duration-500"
        style={{ opacity: isMounted ? 1 : 0 }}
      >
        {/* Desktop Table View */}
        <table className="w-full text-sm text-center hidden md:table min-w-[800px]">
          <thead className="text-sm bg-[var(--primary)] text-[var(--text-primary)]">
            <tr>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--accent)]"
                onClick={() => handleSort('id')}
              >
                شماره سفارش {getSortIndicator('id')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--accent)]"
                onClick={() => handleSort('user_id')}
              >
                کاربر {getSortIndicator('user_id')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--accent)]"
                onClick={() => handleSort('total_amount')}
              >
                مبلغ کل {getSortIndicator('total_amount')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--accent)]"
                onClick={() => handleSort('status')}
              >
                وضعیت {getSortIndicator('status')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--accent)]"
                onClick={() => handleSort('created_at')}
              >
                تاریخ ایجاد {getSortIndicator('created_at')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--accent)]"
                onClick={() => handleSort('updated_at')}
              >
                تاریخ به‌روزرسانی {getSortIndicator('updated_at')}
              </th>
              <th className="px-4 py-3 font-medium">عملیات</th>
              <th className="px-4 py-3 font-medium">جزئیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sortedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-[var(--text-secondary)]">
                  هیچ سفارشی یافت نشد 🥺
                </td>
              </tr>
            ) : (
              sortedOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-[var(--bg-base)] transition-all duration-200">
                    <td className="px-4 py-4 text-[var(--text-primary)] align-middle">{order.id}</td>
                    <td className="px-4 py-4 text-[var(--text-secondary)] align-middle">{order.user_id}</td>
                    <td className="px-4 py-4 text-[var(--text-secondary)] align-middle">{formatPrice(order.total_amount)}</td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className="px-2 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: getStatusColor(order.order_status),
                          color: 'var(--text-primary)',
                        }}
                      >
                        {getPersianStatus(order.order_status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)] align-middle">
                      {new Date(order.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)] align-middle">
                      {new Date(order.updated_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-center gap-3">
                        {order.order_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'processing')}
                              className="p-2 hover:bg-[var(--success)]/10 rounded-full transition-all duration-200"
                              title="تأیید"
                              disabled={loading}
                            >
                              <CheckIcon className="w-5 h-5 text-[var(--success)]" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                              className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                              title="لغو"
                              disabled={loading}
                            >
                              <XMarkIcon className="w-5 h-5 text-[var(--error)]" />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                              title="حذف"
                              disabled={loading}
                            >
                              <TrashIcon className="w-5 h-5 text-[var(--error)]" />
                            </button>
                          </>
                        )}
                        {order.order_status === 'processing' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'shipped')}
                              className="p-2 hover:bg-[var(--primary)]/10 rounded-full transition-all duration-200"
                              title="ارسال"
                              disabled={loading}
                            >
                              <TruckIcon className="w-5 h-5 text-[var(--primary)]" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                              className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                              title="لغو"
                              disabled={loading}
                            >
                              <XMarkIcon className="w-5 h-5 text-[var(--error)]" />
                            </button>
                          </>
                        )}
                        {order.order_status === 'shipped' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'delivered')}
                              className="p-2 hover:bg-[var(--accent)]/10 rounded-full transition-all duration-200"
                              title="تحویل داده شده"
                              disabled={loading}
                            >
                              <ArchiveBoxIcon className="w-5 h-5 text-[var(--accent)]" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                              className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                              title="لغو"
                              disabled={loading}
                            >
                              <XMarkIcon className="w-5 h-5 text-[var(--error)]" />
                            </button>
                          </>
                        )}
                        {(order.order_status === 'delivered' || order.order_status === 'cancelled') && (
                          <span className="text-[var(--text-secondary)]">—</span>
                        )}
                        {order.order_status === 'under_consideration' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                            className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                            title="لغو"
                            disabled={loading}
                          >
                            <XMarkIcon className="w-5 h-5 text-[var(--error)]" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => toggleRow(order.id)}
                          className="p-2 hover:bg-[var(--accent)]/10 rounded-full transition-all duration-200"
                          title={expandedRows.includes(order.id) ? 'مخفی کردن' : 'نمایش'}
                        >
                          {expandedRows.includes(order.id) ? (
                            <EyeSlashIcon className="w-5 h-5 text-[var(--accent)]" />
                          ) : (
                            <EyeIcon className="w-5 h-5 text-[var(--accent)]" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.includes(order.id) && (
                    <tr className="bg-[var(--bg-base)] animate-slide-down">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="text-[var(--text-primary)] text-center">
                          <h4 className="font-medium mb-4 text-[var(--primary)]">جزئیات سفارش 🌟</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium mb-2 text-[var(--text-primary)]">آدرس تحویل</h5>
                              <p className="text-[var(--text-secondary)]">{order.address.street}</p>
                              <p className="text-[var(--text-secondary)]">
                                {order.address.city}, {order.address.state_province || 'نامشخص'}
                              </p>
                              <p className="text-[var(--text-secondary)]">کد پستی: {order.address.postal_code}</p>
                            </div>
                            <div>
                              <h5 className="font-medium mb-2 text-[var(--text-primary)]">محصولات</h5>
                              {order.items.length === 0 ? (
                                <p className="text-[var(--text-secondary)]">هیچ محصولی یافت نشد</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-center rounded-lg">
                                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                                      <tr>
                                        <th className="px-4 py-2">نام محصول</th>
                                        <th className="px-4 py-2">تعداد</th>
                                        <th className="px-4 py-2">قیمت</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                      {order.items.map((item) => (
                                        <tr
                                          key={item.id}
                                          className="hover:bg-[var(--bg-elevated)] transition-colors duration-150"
                                        >
                                          <td className="px-4 py-2 align-middle">{item.variant.product.name}</td>
                                          <td className="px-4 py-2 align-middle">{item.quantity}</td>
                                          <td className="px-4 py-2 align-middle">{formatPrice(item.price_at_order)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4">
          {sortedOrders.length === 0 ? (
            <p className="text-center text-[var(--text-secondary)]">هیچ سفارشی یافت نشد 🥺</p>
          ) : (
            sortedOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg p-4 shadow-md transition-all duration-200 border"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <h3 className="font-medium text-[var(--text-primary)]">سفارش #{order.id}</h3>
                  <p className="text-[var(--text-secondary)]">کاربر: {order.user_id}</p>
                  <p className="text-[var(--text-secondary)]">مبلغ کل: {formatPrice(order.total_amount)}</p>
                  <p>
                    <span
                      className="px-2 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: getStatusColor(order.order_status),
                        color: 'var(--text-primary)',
                      }}
                    >
                      {getPersianStatus(order.order_status)}
                    </span>
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {order.order_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'processing')}
                          className="p-2 hover:bg-[var(--success)]/10 rounded-full transition-all duration-200"
                          title="تأیید"
                          disabled={loading}
                        >
                          <CheckIcon className="w-5 h-5 text-[var(--success)]" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                          title="لغو"
                          disabled={loading}
                        >
                          <XMarkIcon className="w-5 h-5 text-[var(--error)]" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                          title="حذف"
                          disabled={loading}
                        >
                          <TrashIcon className="w-5 h-5 text-[var(--error)]" />
                        </button>
                      </>
                    )}
                    {order.order_status === 'processing' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'shipped')}
                          className="p-2 hover:bg-[var(--primary)]/10 rounded-full transition-all duration-200"
                          title="ارسال"
                          disabled={loading}
                        >
                          <TruckIcon className="w-5 h-5 text-[var(--primary)]" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                          title="لغو"
                          disabled={loading}
                        >
                          <XMarkIcon className="w-5 h-5 text-[var(--error)]" />
                        </button>
                      </>
                    )}
                    {order.order_status === 'shipped' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'delivered')}
                          className="p-2 hover:bg-[var(--accent)]/10 rounded-full transition-all duration-200"
                          title="تحویل داده شده"
                          disabled={loading}
                        >
                          <ArchiveBoxIcon className="w-5 h-5 text-[var(--accent)]" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                          title="لغو"
                          disabled={loading}
                        >
                          <XMarkIcon className="w-5 h-5 text-[var(--error)]" />
                        </button>
                      </>
                    )}
                    {order.order_status === 'under_consideration' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        className="p-2 hover:bg-[var(--error)]/10 rounded-full transition-all duration-200"
                        title="لغو"
                        disabled={loading}
                      >
                        <XMarkIcon className="w-5 h-5 text-[var(--error)]" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleRow(order.id)}
                      className="p-2 hover:bg-[var(--accent)]/10 rounded-full transition-all duration-200"
                      title={expandedRows.includes(order.id) ? 'مخفی کردن' : 'نمایش'}
                    >
                      {expandedRows.includes(order.id) ? (
                        <EyeSlashIcon className="w-5 h-5 text-[var(--accent)]" />
                      ) : (
                        <EyeIcon className="w-5 h-5 text-[var(--accent)]" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-[var(--text-secondary)] text-center">
                  <p>تاریخ ایجاد: {new Date(order.created_at).toLocaleDateString('fa-IR')}</p>
                  <p>تاریخ به‌روزرسانی: {new Date(order.updated_at).toLocaleDateString('fa-IR')}</p>
                </div>
                {expandedRows.includes(order.id) && (
                  <div
                    className="mt-4 p-4 rounded-md animate-slide-down text-center"
                    style={{ backgroundColor: 'var(--bg-elevated)' }}
                  >
                    <h4 className="font-medium mb-2 text-[var(--primary)]">جزئیات سفارش 🌟</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-2 text-[var(--text-primary)]">آدرس تحویل</h5>
                        <p className="text-[var(--text-secondary)]">{order.address.street}</p>
                        <p className="text-[var(--text-secondary)]">
                          {order.address.city}, {order.address.state_province || 'نامشخص'}
                        </p>
                        <p className="text-[var(--text-secondary)]">کد پستی: {order.address.postal_code}</p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-[var(--text-primary)]">محصولات</h5>
                        {order.items.length === 0 ? (
                          <p className="text-[var(--text-secondary)]">هیچ محصولی یافت نشد</p>
                        ) : (
                          order.items.map((item) => (
                            <div
                              key={item.id}
                              className="border-b py-2"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <p className="text-[var(--text-primary)]">نام محصول: {item.variant.product.name}</p>
                              <p className="text-[var(--text-primary)]">تعداد: {item.quantity}</p>
                              <p className="text-[var(--text-primary)]">قیمت: {formatPrice(item.price_at_order)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-[rgba(15,23,42,0.8)] px-4">
          <div
            className="rounded-xl shadow-2xl p-6 w-full max-w-md animate-bounce-in border text-center"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">تأیید حذف سفارش 🚨</h3>
            <p className="mb-6 text-[var(--text-secondary)] text-sm sm:text-base">
              آیا مطمئن هستید که می‌خواهید این سفارش را حذف کنید؟ این عملیات قابل بازگشت نیست! 😱
            </p>
            {errorMessage && (
              <p className="mb-4 text-sm text-[var(--error)]">{errorMessage}</p>
            )}
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg bg-[var(--bg-base)] text-[var(--text-primary)] hover:bg-[var(--bg-base)]/80 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                disabled={loading}
              >
                لغو
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-[var(--error)] text-[var(--text-primary)] hover:bg-[var(--error)]/80 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? <BarLoader color="var(--text-primary)" width={80} /> : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;