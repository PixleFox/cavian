'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaKey, FaSignInAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        router.push('/admin/panel');
      } else {
        const data = await response.json();
        setError(data.error || 'توکن نامعتبر است');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-4" dir="rtl">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#1E293B]/70 backdrop-blur-md p-6 sm:p-8 rounded-lg shadow-2xl border border-[#334155]/50 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8 space-y-4">
          <Link href="/" className="flex flex-col items-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="mb-4 text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
            >
              <Image
                src="/bluelogo.png"
                alt="Cavian Logo"
                width={100}
                height={100}
                className="filter drop-shadow-lg"
              />
            </motion.div>
            <span className="text-3xl font-extrabold text-[#7C3AED] font-heading tracking-wide hover:text-[#6D28D9] transition-colors">
              کاویان
            </span>
          </Link>
          <p className="text-[#7C3AED] text-center font-body leading-loose">
            تن پوش های راوی <br />
            <span className="text-[#94A3B8]">
              برای ورود به پنل توکن خود را وارد نمایید.
            </span>
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="token" className="block text-sm font-medium text-[#94A3B8] mb-2 font-body">
            <FaKey className="inline-block ml-2" />
            توکن ادمین:
          </label>
          <input
            type="password"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            className="w-full px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-[#E2E8F0] placeholder-[#64748B] text-right font-body tracking-wide"
            placeholder="توکن خود را وارد کنید"
            dir="rtl"
            required
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-heading font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:translate-y-[-2px] transform shadow-lg hover:shadow-xl focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <span className="flex items-center">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mr-2"
              >
                <FaSignInAlt />
              </motion.span>
              در حال ورود...
            </span>
          ) : (
            <span className="flex items-center">
              <FaSignInAlt className="mr-2" />
              ورود
            </span>
          )}
        </motion.button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 text-center text-sm text-[#EF4444] font-body animate-pulse"
          >
            {error}
          </motion.div>
        )}
      </motion.form>
    </div>
  );
}