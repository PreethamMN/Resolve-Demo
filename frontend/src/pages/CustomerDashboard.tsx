import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Order } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { PlusCircle, ShoppingBag, Ticket as TicketIcon, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsData, ordersData] = await Promise.all([
          api.getTickets(),
          api.getMyOrders(),
        ]);
        setTickets(ticketsData);
        setOrders(ordersData);
      } catch (err) {
        console.error("Error loading customer data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openTickets = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED');
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Support Center</h1>
          <p className="text-sm text-gray-500 mt-1">Manage order inquiries, track issue resolution, and communicate with support</p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center space-x-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm text-sm"
        >
          <PlusCircle size={18} />
          <span>New Support Ticket</span>
        </Link>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">My Orders</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{openTickets.length}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Open Support Tickets</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{resolvedTickets.length}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Resolved & Closed</div>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TicketIcon size={20} className="text-brand-600" /> My Support Tickets
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-gray-400 font-medium">No support tickets found</div>
            <p className="text-sm text-gray-500">If you experienced an issue with an order, create a ticket below.</p>
            <Link
              to="/tickets/new"
              className="inline-flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <PlusCircle size={16} />
              <span>Create Ticket</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {ticket.id}
                    </span>
                    <span className="text-xs font-medium text-slate-500">Order: #{ticket.order_id}</span>
                    <CategoryBadge category={ticket.category} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <Link to={`/tickets/${ticket.id}`} className="text-base font-semibold text-gray-900 hover:text-brand-600 block">
                    {ticket.subject}
                  </Link>
                  <p className="text-sm text-gray-600 line-clamp-1">{ticket.description}</p>
                  <div className="text-xs text-gray-400">
                    Created on {new Date(ticket.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end">
                  <StatusBadge status={ticket.status} />
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="inline-flex items-center space-x-1 text-sm font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>View Ticket</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
