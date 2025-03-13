'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import TicketDetails from './TicketDetails';
import CreateTicketForm from './CreateTicketForm';
import { formatDate } from '../utils/date';

interface Ticket {
  id: number;
  user_id: number;
  admin_id?: number;
  subject: string;
  status: string;
  created_at: string;
  phone_number: string;
  user: { full_name: string; Main_Address: string | null };
  admin?: { full_name: string } | null;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: string;
  message: string;
  created_at: string;
  admin_id?: number;
  user_id?: number;
  admin?: { full_name: string } | null;
  user?: { full_name: string } | null;
}

interface TicketTableProps {
  tickets: Ticket[];
  onDelete: (ticketId: number) => void;
  onRefresh: () => void;
}

export default function TicketTable({ tickets, onDelete, onRefresh }: TicketTableProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: string | null; order: 'asc' | 'desc' | null }>({
    field: null,
    order: null,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDelete = (ticketId: number) => {
    setTicketToDelete(ticketId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!ticketToDelete || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tickets?id=${ticketToDelete}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در حذف تیکت');
      }

      onDelete(ticketToDelete);
      setShowDeleteModal(false);
      setTicketToDelete(null);
    } catch (error) {
      // Type guard to safely access error.message
      const message = error instanceof Error ? error.message : 'یک خطای ناشناخته رخ داد';
      console.error('خطا در حذف تیکت:', error);
      alert(`خطا: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTicketToDelete(null);
  };

  const handleStatusUpdate = async (ticketId: number, status: string) => {
    try {
      const response = await fetch(`/api/tickets?id=${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'خطا در به‌روزرسانی وضعیت');
      onRefresh();
    } catch (error) {
      // Type guard to safely access error.message
      const message = error instanceof Error ? error.message : 'یک خطای ناشناخته رخ داد';
      console.error('خطا در به‌روزرسانی وضعیت:', error);
      alert(`خطا: ${message}`);
    }
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

  const sortedTickets = [...tickets].sort((a, b) => {
    if (!sortConfig.field || !sortConfig.order) return 0;
    let comparison = 0;
    switch (sortConfig.field) {
      case 'subject':
        comparison = a.subject.localeCompare(b.subject);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:scale-105 transition-all duration-200"
        >
          ایجاد تیکت جدید
        </button>
      </div>

      <div
        className={`overflow-x-auto rounded-xl shadow-lg border border-gray-600 bg-gradient-to-br from-gray-800 to-gray-900 transition-opacity duration-500 ${
          isMounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <table className="w-full text-sm text-right text-gray-300">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100">
            <tr>
              <th
                className="px-6 py-4 font-medium cursor-pointer hover:text-purple-300 transition-colors"
                onClick={() => handleSort('subject')}
              >
                موضوع {getSortIndicator('subject')}
              </th>
              <th
                className="px-6 py-4 font-medium cursor-pointer hover:text-purple-300 transition-colors"
                onClick={() => handleSort('status')}
              >
                وضعیت {getSortIndicator('status')}
              </th>
              <th className="px-6 py-4 font-medium">شماره تلفن</th>
              <th
                className="px-6 py-4 font-medium cursor-pointer hover:text-purple-300 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                تاریخ ایجاد {getSortIndicator('created_at')}
              </th>
              <th className="px-6 py-4 font-medium">نام کاربر</th>
              <th className="px-6 py-4 font-medium">آدرس اصلی</th>
              <th className="px-6 py-4 font-medium">ایجاد شده توسط</th>
              <th className="px-6 py-4 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500">
            {sortedTickets.length === 0 ? (
              <tr key="empty">
                <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                  هیچ تیکتی یافت نشد 🥺
                </td>
              </tr>
            ) : (
              sortedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-700 hover:scale-[1.01] transition-all duration-200 ease-in-out"
                >
                  <td className="px-6 py-4 text-gray-100 max-w-[200px] truncate" title={ticket.subject}>
                    {ticket.subject}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-1 text-white hover:bg-gray-700 transition-colors"
                    >
                      <option value="OPEN">باز</option>
                      <option value="IN_PROGRESS">در حال بررسی</option>
                      <option value="CLOSED">بسته شده</option>
                      <option value="PENDING">در انتظار</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{ticket.phone_number}</td>
                  <td className="px-6 py-4 text-gray-400">{formatDate(ticket.created_at)}</td>
                  <td className="px-6 py-4 text-gray-400">{ticket.user.full_name}</td>
                  <td className="px-6 py-4 text-gray-400 max-w-[200px] truncate" title={ticket.user.Main_Address || ''}>
                    {ticket.user.Main_Address || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{ticket.admin?.full_name || '-'}</td>
                  <td className="px-6 py-4 space-x-4">
                    <button
                      onClick={() => setShowDetails(ticket.id)}
                      className="text-blue-400 hover:text-blue-600 hover:scale-110 transition-transform duration-200"
                      title="نمایش جزئیات"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.id)}
                      className="text-red-400 hover:text-red-600 hover:scale-110 transition-transform duration-200"
                      title="حذف"
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-600 animate-bounce-in">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">تأیید حذف تیکت 🚨</h3>
            <p className="text-gray-300 mb-6">آیا مطمئن هستید که می‌خواهید این تیکت را حذف کنید؟ این عملیات قابل بازگشت نیست! 😱</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-700 hover:scale-105 transition-all duration-200"
                disabled={loading}
              >
                لغو
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:scale-105 transition-all duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <TicketDetails
          ticket={tickets.find((t) => t.id === showDetails) || null}
          onClose={() => setShowDetails(null)}
          onRefresh={onRefresh}
        />
      )}

      {showCreateForm && (
        <CreateTicketForm onClose={() => setShowCreateForm(false)} onRefresh={onRefresh} />
      )}
    </>
  );
}