'use client';
import { useState, useEffect } from 'react';
import UserTable from '../components/UserTable';

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
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
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (userId: number) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  if (loading) {
    return <div className="text-center text-gray-400 mt-10">در حال بارگذاری...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">مدیریت کاربران</h1>
      <UserTable users={users} onDelete={handleDelete} />
    </div>
  );
}