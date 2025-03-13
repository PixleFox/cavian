'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface User {
  id: number;
  full_name: string;
  phone_number: string;
}

interface CreateTicketFormProps {
  onClose: () => void;
  onRefresh: () => void;
}

// Define the form data type based on the schema
type FormData = {
  user_id: number;
  subject: string;
  initial_message: string;
};

const schema = yup.object().shape({
  user_id: yup.number().required('انتخاب کاربر الزامی است'),
  subject: yup.string().required('موضوع الزامی است'),
  initial_message: yup.string().required('پیام اولیه الزامی است'),
});

export default function CreateTicketForm({ onClose, onRefresh }: CreateTicketFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      user_id: 0,
      subject: '',
      initial_message: '',
    },
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (response.ok) {
          setUsers(data);
        } else {
          throw new Error(data.error || 'خطا در دریافت کاربران');
        }
      } catch (error) {
        console.error('خطا در دریافت کاربران:', error);
        if (error instanceof Error) {
          alert(`خطا: ${error.message}`);
        } else {
          alert('خطای ناشناخته رخ داد');
        }
      }
    };
    fetchUsers();
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const adminId = 1; // Replace with actual admin ID from auth (e.g., from cookie)
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user_id,
          subject: data.subject,
          phone_number: users.find((user) => user.id === data.user_id)?.phone_number || '',
          admin_id: adminId,
          initial_message: data.initial_message,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'خطا در ایجاد تیکت');
      }
      reset();
      onRefresh();
      onClose();
    } catch (error) {
      console.error('خطا در ایجاد تیکت:', error);
      if (error instanceof Error) {
        alert(`خطا: ${error.message}`);
      } else {
        alert('خطای ناشناخته رخ داد');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-purple-400">ایجاد تیکت جدید</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✖️
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">کاربر</label>
            <select
              {...register('user_id')}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value={0} disabled>
                یک کاربر انتخاب کنید
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.phone_number})
                </option>
              ))}
            </select>
            {errors.user_id && <span className="text-red-500 text-sm">{errors.user_id.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">موضوع</label>
            <input
              {...register('subject')}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            {errors.subject && <span className="text-red-500 text-sm">{errors.subject.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">پیام اولیه</label>
            <textarea
              {...register('initial_message')}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              rows={4}
            />
            {errors.initial_message && (
              <span className="text-red-500 text-sm">{errors.initial_message.message}</span>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-700 hover:scale-105 transition-all duration-200"
            >
              لغو
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'در حال ایجاد...' : 'ایجاد تیکت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}