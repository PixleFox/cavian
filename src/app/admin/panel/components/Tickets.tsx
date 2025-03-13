'use client';
import { useState, useEffect } from 'react';
import TicketTable from './TicketTable';

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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      if (response.ok) {
        setTickets(data);
      } else {
        throw new Error(data.error || 'خطا در دریافت تیکت‌ها');
      }
    } catch (error) {
      console.error('خطا در دریافت تیکت‌ها:', error);
      if (error instanceof Error) {
        alert(`خطا: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDelete = (ticketId: number) => {
    setTickets((prevTickets) => prevTickets.filter((ticket) => ticket.id !== ticketId));
  };

  if (loading) {
    return <div className="text-center text-gray-400 mt-10">در حال بارگذاری...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">مدیریت تیکت‌ها</h1>
      <TicketTable tickets={tickets} onDelete={handleDelete} onRefresh={fetchTickets} />
    </div>
  );
}