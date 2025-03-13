'use client';
import { useState } from 'react';
import React from 'react';

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

interface TicketDetailsProps {
  ticket: Ticket | null;
  onClose: () => void;
  onRefresh: () => void;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TicketDetails({ ticket, onClose, onRefresh }: TicketDetailsProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !ticket) return;

    setLoading(true);
    setError(null);

    try {
      const adminId = 1; // Replace with actual admin ID from auth
      const response = await fetch('/api/tickets?action=message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id, message, admin_id: adminId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'خطا در ارسال پیام');
      }

      setMessage('');
      onRefresh();
    } catch (error) {
      console.error('خطا در ارسال پیام:', error);
      setError(error instanceof Error ? error.message : 'خطای ناشناخته رخ داد');
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-purple-400 truncate">{ticket.subject}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-full"
          >
            ✖️
          </button>
        </div>

        {/* Ticket Info */}
        <div className="space-y-3 text-gray-300">
          <p><strong className="text-gray-400">وضعیت:</strong> {ticket.status}</p>
          <p><strong className="text-gray-400">شماره تلفن:</strong> {ticket.phone_number}</p>
          <p><strong className="text-gray-400">نام کاربر:</strong> {ticket.user.full_name}</p>
          <p><strong className="text-gray-400">آدرس اصلی:</strong> {ticket.user.Main_Address || '-'}</p>
          <p><strong className="text-gray-400">ایجاد شده توسط:</strong> {ticket.admin?.full_name || '-'}</p>
          <p><strong className="text-gray-400">تاریخ ایجاد:</strong> {new Date(ticket.created_at).toLocaleDateString('fa-IR')}</p>
        </div>

        {/* Messages Section */}
        <div className="mt-6 border-t border-gray-700 pt-4">
          <h4 className="text-lg font-semibold text-gray-200 mb-4">پیام‌ها</h4>
          <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg shadow-sm max-w-[70%] ${
                  msg.sender_type === 'ADMIN'
                    ? 'bg-blue-900 ml-auto text-right'
                    : 'bg-gray-800 mr-auto text-left'
                } hover:bg-opacity-90 transition-all duration-200`}
              >
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-200 leading-relaxed break-words">
                    {msg.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {msg.sender_type === 'ADMIN' ? `ادمین: ${msg.admin?.full_name || 'ناشناس'}` : `کاربر: ${msg.user?.full_name || 'ناشناس'}`}
                    {' - '}
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleReply} className="mt-6 flex flex-col gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="پاسخ خود را اینجا بنویسید..."
            className="w-full p-3 border border-gray-700 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all duration-200 resize-y min-h-[100px]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {loading ? 'در حال ارسال...' : 'ارسال'}
          </button>
          {error && (
            <div className="mt-2 p-3 bg-red-900/80 border border-red-700 rounded-lg text-white text-sm flex justify-between items-center animate-fade-in">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Custom scrollbar and animation styles
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  .scrollbar-thumb-gray-700 {
    scrollbar-color: #4B5563 #1F2937;
  }
  .scrollbar-track-gray-900 {
    background: #1F2937;
  }
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-thumb {
    background: #4B5563;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-track {
    background: #1F2937;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}