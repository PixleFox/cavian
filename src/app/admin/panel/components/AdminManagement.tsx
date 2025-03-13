'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { PencilIcon, TrashIcon, ClipboardIcon } from '@heroicons/react/24/outline';

interface Admin {
  id: number;
  phone_number: string;
  full_name: string;
  Authority_level: number; // Matches Prisma schema
  createdAt: string;
  isActive: boolean;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdmin, setNewAdmin] = useState({
    phone_number: '',
    full_name: '',
    authority_level: 1, // Lowercase to match API schema
  });
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [generatedToken, setGeneratedToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch admins on mount (assuming GET /api/admin exists)
  useEffect(() => {
    const fetchAdmins = async () => {
      setFetchLoading(true);
      try {
        const response = await fetch('/api/admin', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch admins');
        setAdmins(data);
      } catch (error) {
        console.error('Error fetching admins:', error); // Log the error
        toast.error('خطا در بارگذاری ادمین‌ها', {
          style: { background: '#EF4444', color: '#fff' },
        });
      } finally {
        setFetchLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  // Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedToken('');

    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'مشکلی در ایجاد ادمین پیش آمد');
      }

      const { id, fullName, phoneNumber, authorityLevel, createdAt, token } = result.data;

      setGeneratedToken(token);
      setNewAdmin({ phone_number: '', full_name: '', authority_level: 1 });
      setAdmins((prev) => [
        ...prev,
        {
          id,
          phone_number: phoneNumber,
          full_name: fullName,
          Authority_level: authorityLevel, // Map to Prisma field
          createdAt,
          isActive: true, // Assumed since newly created
        },
      ]);
      toast.success('ادمین با موفقیت ایجاد شد!', {
        style: { background: '#10B981', color: '#fff' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطای ناشناخته رخ داد';
      toast.error(message, { style: { background: '#EF4444', color: '#fff' } });
    } finally {
      setIsLoading(false);
    }
  };

  // Edit Admin (assuming PUT /api/admin exists)
  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin?id=${editAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: editAdmin.phone_number,
          full_name: editAdmin.full_name,
          authority_level: editAdmin.Authority_level, // Lowercase for API
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'مشکلی در ویرایش ادمین پیش آمد');

      setAdmins((prev) =>
        prev.map((admin) => (admin.id === editAdmin.id ? { ...editAdmin } : admin))
      );
      setEditAdmin(null);
      toast.success('ادمین با موفقیت ویرایش شد!', {
        style: { background: '#10B981', color: '#fff' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطای ناشناخته رخ داد';
      toast.error(message, { style: { background: '#EF4444', color: '#fff' } });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Admin (assuming DELETE /api/admin exists)
  const handleDeleteAdmin = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'مشکلی در حذف ادمین پیش آمد');
      }

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      toast.success('ادمین با موفقیت حذف شد!', {
        style: { background: '#10B981', color: '#fff' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطای ناشناخته رخ داد';
      toast.error(message, { style: { background: '#EF4444', color: '#fff' } });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset token display after 10 seconds
  useEffect(() => {
    if (generatedToken) {
      const timer = setTimeout(() => setGeneratedToken(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [generatedToken]);

  // Copy token to clipboard
  const handleCopyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    toast.success('توکن کپی شد!', { style: { background: '#10B981', color: '#fff' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <Toaster position="top-right" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8"
      >
        <h3 className="text-2xl md:text-3xl font-bold text-purple-400 mb-6">
          مدیریت ادمین‌ها
        </h3>

        {/* Create Admin Form */}
        <form onSubmit={handleCreateAdmin} className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                شماره موبایل
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+989123456789"
                value={newAdmin.phone_number}
                onChange={(e) => setNewAdmin({ ...newAdmin, phone_number: e.target.value })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                pattern="\+98\d{10}"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                نام کامل
              </label>
              <input
                id="name"
                type="text"
                placeholder="نام و نام خانوادگی"
                value={newAdmin.full_name}
                onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                required
              />
            </div>
            <div>
              <label htmlFor="authority" className="block text-sm font-medium text-gray-300 mb-1">
                سطح دسترسی
              </label>
              <select
                id="authority"
                value={newAdmin.authority_level}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, authority_level: Number(e.target.value) })
                }
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              >
                <option value={1}>ادمین معمولی</option>
                <option value={2}>سوپر ادمین</option>
              </select>
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } transition-all duration-300 flex items-center justify-center`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : null}
            {isLoading ? 'در حال ایجاد...' : 'ایجاد ادمین جدید'}
          </motion.button>
        </form>

        {/* Token Display */}
        <AnimatePresence>
          {generatedToken && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-8 p-4 bg-gray-900 rounded-lg border border-teal-500"
            >
              <div className="flex flex-col gap-2">
                <p className="text-teal-400 font-medium">توکن ایجاد شده:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-white break-all bg-gray-800 p-2 rounded-md">
                    {generatedToken}
                  </code>
                  <button
                    onClick={handleCopyToken}
                    className="p-2 bg-teal-600 hover:bg-teal-700 rounded-md text-white transition-all duration-200"
                    title="کپی توکن"
                  >
                    <ClipboardIcon className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-400">این توکن پس از ۱۰ ثانیه ناپدید می‌شود. آن را کپی کنید!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admins Table */}
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-gray-200 mb-4">لیست ادمین‌ها</h4>
          {fetchLoading ? (
            <div className="text-center text-gray-400">در حال بارگذاری...</div>
          ) : admins.length === 0 ? (
            <div className="text-center text-gray-400">هیچ ادمینی یافت نشد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-sm font-medium text-gray-200">شناسه</th>
                    <th className="p-3 text-sm font-medium text-gray-200">شماره موبایل</th>
                    <th className="p-3 text-sm font-medium text-gray-200">نام کامل</th>
                    <th className="p-3 text-sm font-medium text-gray-200">سطح دسترسی</th>
                    <th className="p-3 text-sm font-medium text-gray-200">وضعیت</th>
                    <th className="p-3 text-sm font-medium text-gray-200">تاریخ ایجاد</th>
                    <th className="p-3 text-sm font-medium text-gray-200">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-gray-700 hover:bg-gray-750 transition-all duration-200"
                    >
                      <td className="p-3">{admin.id}</td>
                      <td className="p-3">{admin.phone_number}</td>
                      <td className="p-3">{admin.full_name}</td>
                      <td className="p-3">
                        {admin.Authority_level === 1 ? 'ادمین معمولی' : 'سوپر ادمین'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            admin.isActive ? 'bg-green-500' : 'bg-red-500'
                          } text-white`}
                        >
                          {admin.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="p-3">
                        {new Date(admin.createdAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => setEditAdmin(admin)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-all duration-200"
                          title="ویرایش"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-all duration-200"
                          title="حذف"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Admin Modal */}
        <AnimatePresence>
          {editAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md"
              >
                <h4 className="text-xl font-bold text-purple-400 mb-4">ویرایش ادمین</h4>
                <form onSubmit={handleEditAdmin} className="space-y-4">
                  <div>
                    <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-300 mb-1">
                      شماره موبایل
                    </label>
                    <input
                      id="edit-phone"
                      type="tel"
                      value={editAdmin.phone_number}
                      onChange={(e) =>
                        setEditAdmin({ ...editAdmin, phone_number: e.target.value })
                      }
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      pattern="\+98\d{10}"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-1">
                      نام کامل
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      value={editAdmin.full_name}
                      onChange={(e) =>
                        setEditAdmin({ ...editAdmin, full_name: e.target.value })
                      }
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-authority" className="block text-sm font-medium text-gray-300 mb-1">
                      سطح دسترسی
                    </label>
                    <select
                      id="edit-authority"
                      value={editAdmin.Authority_level}
                      onChange={(e) =>
                        setEditAdmin({ ...editAdmin, Authority_level: Number(e.target.value) })
                      }
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    >
                      <option value={1}>ادمین معمولی</option>
                      <option value={2}>سوپر ادمین</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.05 }}
                      whileTap={{ scale: isLoading ? 1 : 0.95 }}
                      className={`flex-1 py-2 px-4 rounded-lg text-white font-semibold ${
                        isLoading
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700'
                      } transition-all duration-300`}
                    >
                      {isLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setEditAdmin(null)}
                      className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-all duration-300"
                    >
                      لغو
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}