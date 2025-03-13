'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import UserForm from './UserForm';

// Define User interface with Main_Address
interface User {
  id: number;
  full_name: string;
  phone_number: string;
  Main_Address: string; // Added Main Address
  email: string;
  national_id: string;
  bank_card_number: string;
  birth_date: string;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  last_logout: string | null;
  Level: number;
}

interface UserTableProps {
  users: User[];
  onDelete: (userId: number) => void;
}

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default function UserTable({ users, onDelete }: UserTableProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: string | null; order: 'asc' | 'desc' | null }>({
    field: null,
    order: null,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDelete = (userId: number) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users?id=${userToDelete}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در حذف کاربر');
      }

      onDelete(userToDelete);
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('خطا در حذف کاربر:', error);
      if (error instanceof Error) {
        alert(`خطا: ${error.message}`);
      } else {
        alert('خطا: یک خطای ناشناخته رخ داد');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setSelectedUser(null);
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

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig.field || !sortConfig.order) return 0;

    let comparison = 0;
    switch (sortConfig.field) {
      case 'full_name':
        comparison = a.full_name.localeCompare(b.full_name);
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'Main_Address': // Added sorting for Main Address
        comparison = a.Main_Address.localeCompare(b.Main_Address);
        break;
      case 'Level':
        comparison = a.Level - b.Level;
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
      <div
        className={`overflow-x-auto rounded-xl shadow-lg border border-gray-600 bg-gradient-to-br from-gray-800 to-gray-900 transition-opacity duration-500 ${
          isMounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Desktop Table View */}
        <table className="w-full text-sm text-right text-gray-300 hidden md:table">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100">
            <tr>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-purple-300 transition-colors"
                onClick={() => handleSort('full_name')}
              >
                نام و نام خانوادگی {getSortIndicator('full_name')}
              </th>
              <th className="px-4 py-3 font-medium">شماره تلفن</th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-purple-300 transition-colors"
                onClick={() => handleSort('Main_Address')}
              >
                آدرس اصلی {getSortIndicator('Main_Address')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-purple-300 transition-colors"
                onClick={() => handleSort('email')}
              >
                ایمیل {getSortIndicator('email')}
              </th>
              <th className="px-4 py-3 font-medium">کدملی</th>
              <th className="px-4 py-3 font-medium">شماره کارت</th>
              <th className="px-4 py-3 font-medium">تاریخ تولد</th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-purple-300 transition-colors"
                onClick={() => handleSort('Level')}
              >
                سطح {getSortIndicator('Level')}
              </th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:text-purple-300 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                تاریخ ثبت {getSortIndicator('created_at')}
              </th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500">
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-gray-400">
                  هیچ کاربری یافت نشد 🥺
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-700 hover:scale-[1.01] transition-all duration-200 ease-in-out"
                >
                  <td className="px-4 py-3 text-gray-100 max-w-[200px] truncate" title={user.full_name}>
                    {user.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{user.phone_number}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate" title={user.Main_Address}>
                    {user.Main_Address}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{user.email}</td>
                  <td className="px-4 py-3 text-gray-400">{user.national_id}</td>
                  <td className="px-4 py-3 text-gray-400">{user.bank_card_number}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(user.birth_date)}</td>
                  <td className="px-4 py-3 text-gray-400">{user.Level}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-purple-400 hover:text-purple-600 hover:scale-110 transition-transform duration-200"
                      title="ویرایش"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4">
          {sortedUsers.length === 0 ? (
            <p className="text-center text-gray-400">هیچ کاربری یافت نشد 🥺</p>
          ) : (
            sortedUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-lg p-4 shadow-md border border-gray-600 bg-gray-800"
              >
                <div className="space-y-2">
                  <p className="text-gray-100 truncate" title={user.full_name}>
                    <span className="font-medium">نام:</span> {user.full_name}
                  </p>
                  <p className="text-gray-400">
                    <span className="font-medium">تلفن:</span> {user.phone_number}
                  </p>
                  <p className="text-gray-400 truncate" title={user.Main_Address}>
                    <span className="font-medium">آدرس:</span> {user.Main_Address}
                  </p>
                  <p className="text-gray-400">
                    <span className="font-medium">ایمیل:</span> {user.email}
                  </p>
                  <p className="text-gray-400">
                    <span className="font-medium">سطح:</span> {user.Level}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-purple-400 hover:text-purple-600 hover:scale-110 transition-transform duration-200"
                      title="ویرایش"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-400 hover:text-red-600 hover:scale-110 transition-transform duration-200"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-600 animate-bounce-in">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">تأیید حذف کاربر 🚨</h3>
            <p className="text-gray-300 mb-6">
              آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟ این عملیات قابل بازگشت نیست! 😱
            </p>
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

      {showEditForm && selectedUser && (
        <UserForm
          onClose={closeEditForm}
          refreshUsers={() => {
            closeEditForm();
          }}
          user={selectedUser}
        />
      )}
    </>
  );
}