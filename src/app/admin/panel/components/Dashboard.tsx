'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ShoppingBagIcon, UserGroupIcon, TicketIcon, CubeIcon, TagIcon } from '@heroicons/react/24/outline';

// Define interfaces for API responses
interface User {
  id: number;
  created_at: string; // Assuming ISO date string
}

interface Order {
  id: number;
  order_status: string;
  total_amount: number | string; // Allow string in case API returns it
}

interface Ticket {
  id: number;
  status: string;
}

interface Product {
  id: number;
}

interface Discount {
  id: number;
  is_active: boolean;
  valid_until: string; // Assuming ISO date string
}

interface DashboardStats {
  totalUsers: number;
  newUsersLast7Days: number;
  totalOrders: number;
  totalOrderValue: number;
  pendingOrders: number;
  openTickets: number;
  totalProducts: number;
  activeDiscounts: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [usersRes, ordersRes, ticketsRes, productsRes, discountsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/orders'),
          fetch('/api/tickets'),
          fetch('/api/products'),
          fetch('/api/discounts'),
        ]);

        if (!usersRes.ok || !ordersRes.ok || !ticketsRes.ok || !productsRes.ok || !discountsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [users, orders, tickets, products, discounts] = await Promise.all([
          usersRes.json() as Promise<User[]>,
          ordersRes.json() as Promise<Order[]>,
          ticketsRes.json() as Promise<Ticket[]>,
          productsRes.json() as Promise<Product[]>,
          discountsRes.json() as Promise<Discount[]>,
        ]);

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newUsersLast7Days = users.filter((user) => new Date(user.created_at) >= sevenDaysAgo).length;
        const pendingOrders = orders.filter((order) => order.order_status === 'pending').length;
        const openTickets = tickets.filter((ticket) =>
          ['OPEN', 'PENDING', 'IN_PROGRESS'].includes(ticket.status)
        ).length;
        const activeDiscounts = discounts.filter(
          (discount) => discount.is_active && new Date(discount.valid_until) > new Date()
        ).length;

        // Ensure totalOrderValue is calculated correctly
        const totalOrderValue = orders.reduce((sum: number, order: Order) => {
          const amount = Number(order.total_amount); // Convert to number explicitly
          return sum + (isNaN(amount) ? 0 : amount); // Handle non-numeric values
        }, 0);

        // Log for debugging
        console.log('Raw totalOrderValue:', totalOrderValue);
        console.log('Orders:', orders);

        setStats({
          totalUsers: users.length,
          newUsersLast7Days,
          totalOrders: orders.length,
          totalOrderValue,
          pendingOrders,
          openTickets,
          totalProducts: products.length,
          activeDiscounts,
        });
      } catch (err) {
        setError('خطا در بارگذاری داده‌ها: ' + (err instanceof Error ? err.message : 'خطای ناشناخته'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const formatPrice = (value: number) => {
    // Ensure value is a number and format it with Persian numerals
    return `${Number(value).toLocaleString('fa-IR')} تومان`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] bg-[#0F172A] text-white">
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] bg-[#0F172A] text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0F172A] text-white min-h-[calc(100vh-12rem)]">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">پیشخوان مدیریت</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">کاربران کل</p>
              <p className="text-2xl font-semibold mt-2">{stats?.totalUsers || 0}</p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>

        {/* New Users Last 7 Days */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">کاربران جدید (۷ روز)</p>
              <p className="text-2xl font-semibold mt-2">{stats?.newUsersLast7Days || 0}</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">سفارشات کل</p>
              <p className="text-2xl font-semibold mt-2">{stats?.totalOrders || 0}</p>
            </div>
            <ShoppingBagIcon className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        {/* Total Order Value */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">ارزش سفارشات کل</p>
              <p className="text-2xl font-semibold mt-2">{formatPrice(stats?.totalOrderValue || 0)}</p>
            </div>
            <ShoppingBagIcon className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        {/* Pending Orders */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">سفارشات در انتظار</p>
              <p className="text-2xl font-semibold mt-2">{stats?.pendingOrders || 0}</p>
            </div>
            <ShoppingBagIcon className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        {/* Open Tickets */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">تیکت‌های باز</p>
              <p className="text-2xl font-semibold mt-2">{stats?.openTickets || 0}</p>
            </div>
            <TicketIcon className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>

        {/* Total Products */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">محصولات کل</p>
              <p className="text-2xl font-semibold mt-2">{stats?.totalProducts || 0}</p>
            </div>
            <CubeIcon className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        {/* Active Discounts */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">تخفیف‌های فعال</p>
              <p className="text-2xl font-semibold mt-2">{stats?.activeDiscounts || 0}</p>
            </div>
            <TagIcon className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;