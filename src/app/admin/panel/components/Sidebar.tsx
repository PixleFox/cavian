'use client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  UsersIcon,
  UserCircleIcon,
  TicketIcon,
  TagIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function NuclearSidebar({
  activeTab,
  setActiveTab,
  handleLogout,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
}) {
  const menus = [
    { id: 'dashboard', label: 'داشبورد', icon: <HomeIcon className="w-6 h-6" /> },
    { id: 'orders', label: 'سفارشات', icon: <ClipboardDocumentListIcon className="w-6 h-6" /> },
    { id: 'products', label: 'محصولات', icon: <ShoppingCartIcon className="w-6 h-6" /> },
    { id: 'users', label: 'کاربران', icon: <UsersIcon className="w-6 h-6" /> },
    { id: 'admins', label: 'ادمین‌ها', icon: <UserCircleIcon className="w-6 h-6" /> },
    { id: 'discounts', label: 'تخفیف‌ها', icon: <TagIcon className="w-6 h-6" /> },
    { id: 'tickets', label: 'تیکت‌ها', icon: <TicketIcon className="w-6 h-6" /> },
  ];

  return (
    <motion.nav
      initial={{ x: '100%', rotateY: 90 }}
      animate={{ x: 0, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="hidden md:flex flex-col h-screen w-64 bg-[#1E293B]/70 backdrop-blur-lg shadow-2xl p-6 fixed right-0 top-0 z-50 border-l border-[#334155]/50"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 border-b border-[#334155]/50 pb-6"
      >
        <h1 className="text-2xl font-bold text-purple-400 glow">پنل مدیریت</h1>
      </motion.div>

      {/* Menu Items */}
      <div className="flex-1 space-y-2">
        {menus.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-right relative overflow-hidden ${
              activeTab === item.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-[#334155]/50'
            }`}
          >
            {/* Floating Icon Animation */}
            <motion.div
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.2, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex items-center justify-center"
            >
              {item.icon}
            </motion.div>
            <span className="text-sm font-medium">{item.label}</span>

            {/* Ripple Effect */}
            <AnimatePresence>
              {activeTab === item.id && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="absolute inset-0 bg-purple-500/20 rounded-lg"
                />
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 p-3 text-red-400 hover:bg-[#334155]/50 rounded-lg transition-all duration-200"
      >
        <ArrowLeftOnRectangleIcon className="w-6 h-6" />
        <span className="text-sm font-medium">خروج از حساب</span>
      </motion.button>
    </motion.nav>
  );
}