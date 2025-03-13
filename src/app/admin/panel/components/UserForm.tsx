'use client';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Validation Schema with Main_Address
const schema = yup.object().shape({
  full_name: yup.string().required('نام و نام خانوادگی الزامی است'),
  phone_number: yup.string().required('شماره تلفن الزامی است').matches(/^\d{11}$/, 'شماره تلفن باید ۱۱ رقم باشد'),
  Main_Address: yup.string().required('آدرس اصلی الزامی است'), // Added Main Address validation
  email: yup.string().email('ایمیل نامعتبر است').required('ایمیل الزامی است'),
  national_id: yup.string().required('کدملی الزامی است').matches(/^\d{10}$/, 'کدملی باید ۱۰ رقم باشد'),
  bank_card_number: yup.string().required('شماره کارت الزامی است').matches(/^\d{16}$/, 'شماره کارت باید ۱۶ رقم باشد'),
  birth_date: yup
    .string()
    .required('تاریخ تولد الزامی است')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ نامعتبر است (YYYY-MM-DD)'),
  referral_code: yup.string().nullable(),
  Level: yup.number().min(1, 'سطح باید حداقل ۱ باشد').required('سطح کاربر الزامی است'),
});

// User interface with Main_Address
interface User {
  id?: number;
  full_name: string;
  phone_number: string;
  Main_Address: string; // Added Main Address
  email: string;
  national_id: string;
  bank_card_number: string;
  birth_date: string;
  referral_code: string | null;
  Level: number;
}

interface UserFormProps {
  onClose: () => void;
  refreshUsers?: () => void;
  user?: User | null;
}

export default function UserForm({ onClose, refreshUsers, user = null }: UserFormProps) {
  const isEditMode = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      full_name: '',
      phone_number: '',
      Main_Address: '', // Added Main Address
      email: '',
      national_id: '',
      bank_card_number: '',
      birth_date: '',
      referral_code: '',
      Level: 1,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        phone_number: user.phone_number,
        Main_Address: user.Main_Address, // Added Main Address
        email: user.email,
        national_id: user.national_id,
        bank_card_number: user.bank_card_number,
        birth_date: new Date(user.birth_date).toISOString().split('T')[0],
        referral_code: user.referral_code || '',
        Level: user.Level,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    try {
      const url = isEditMode ? `/api/users?id=${user?.id}` : '/api/users';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'خطا در ذخیره کاربر');
      }

      reset();
      refreshUsers?.();
      onClose();
    } catch (error: unknown) {
      const err = error as Error;
      alert(`خطا: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6 text-center text-purple-400">
          {isEditMode ? 'ویرایش کاربر' : 'فرم کاربر جدید'}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">نام و نام خانوادگی</label>
            <input {...register('full_name')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg" />
            {errors.full_name && <span className="text-red-500 text-sm">{errors.full_name.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">شماره تلفن</label>
            <input {...register('phone_number')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg" />
            {errors.phone_number && <span className="text-red-500 text-sm">{errors.phone_number.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">آدرس اصلی</label>
            <input {...register('Main_Address')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg" />
            {errors.Main_Address && <span className="text-red-500 text-sm">{errors.Main_Address.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">ایمیل</label>
            <input {...register('email')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg" />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">کدملی</label>
            <input {...register('national_id')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg" />
            {errors.national_id && <span className="text-red-500 text-sm">{errors.national_id.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">شماره کارت</label>
            <input {...register('bank_card_number')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg" />
            {errors.bank_card_number && <span className="text-red-500 text-sm">{errors.bank_card_number.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">تاریخ تولد</label>
            <input
              type="date"
              {...register('birth_date')}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg"
            />
            {errors.birth_date && <span className="text-red-500 text-sm">{errors.birth_date.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">کد معرف (اختیاری)</label>
            <input {...register('referral_code')} className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg" />
            {errors.referral_code && <span className="text-red-500 text-sm">{errors.referral_code.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">سطح کاربر</label>
            <input
              type="number"
              {...register('Level')}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded-lg"
            />
            {errors.Level && <span className="text-red-500 text-sm">{errors.Level.message}</span>}
          </div>
          <div className="col-span-2 flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white border border-gray-700 rounded-lg"
            >
              لغو
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              {isEditMode ? 'به‌روزرسانی کاربر' : 'ذخیره کاربر'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}