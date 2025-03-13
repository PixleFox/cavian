'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NuclearSidebar from './components/Sidebar';
import AdminManagement from './components/AdminManagement';
import Dashboard from './components/Dashboard';
import ProductManager from './components/Products';
import Discounts from './components/Discounts';
import Users from './components/Users';
import Tickets from './components/Tickets';
import OrdersTable, { Order, OrderStatus } from './components/OrdersTable';
import { BarLoader } from 'react-spinners';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/admin/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (!data.authenticated) {
        router.push('/admin/login');
      } else {
        setIsLoggedIn(true);
      }
    };

    checkAuth();

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
          const response = await fetch('/api/orders', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to fetch orders');
          }
          const fetchedOrders = await response.json();
          setOrders(fetchedOrders);
        } catch (err) {
          setOrdersError((err as Error).message || 'An unknown error occurred');
        } finally {
          setOrdersLoading(false);
        }
      };

      fetchOrders();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    router.push('/admin/login');
  };

  const handleStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, order_status: newStatus } : order
      )
    );
  };

  const handleDelete = (orderId: number) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-white">
        <BarLoader color="#7C3AED" width={200} height={4} />
      </div>
    );
  }

  // If mobile, show the warning message instead of the admin panel
  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-white">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center max-w-sm mx-4">
          <h2 className="text-xl font-bold text-purple-400 mb-4">توجه</h2>
          <p className="text-gray-300">
            این پنل مخصوص دسکتاپ توسعه داده شده است و در موبایل کاربرد ندارد.
          </p>
        </div>
      </div>
    );
  }

  // Desktop view: Render the admin panel
  return (
    <div className="flex min-h-screen bg-[#0F172A] text-white">
      {/* Desktop Sidebar */}
      <NuclearSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 transition-all duration-300 mr-64">
        <div className="flex justify-between items-center mb-6">
        </div>

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'admins' && <AdminManagement />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'discounts' && <Discounts />}
        {activeTab === 'users' && <Users />}
        {activeTab === 'tickets' && <Tickets />}
        {activeTab === 'orders' && (
          <>
            {ordersLoading && (
              <div className="text-center text-gray-300">
                <BarLoader color="#7C3AED" width="100%" height={4} />
                <p className="mt-2">در حال بارگذاری سفارش‌ها...</p>
              </div>
            )}
            {ordersError && (
              <div className="text-center text-red-500">خطا: {ordersError}</div>
            )}
            {!ordersLoading && !ordersError && (
              <OrdersTable
                orders={orders}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Navigation (not shown due to warning above) */}
    </div>
  );
}