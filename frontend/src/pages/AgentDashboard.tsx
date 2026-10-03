import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { Headset, Filter, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error("Error loading agent tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const assignedCount = tickets.length;
  const urgentCount = tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const pendingCount = tickets.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Headset className="text-indigo-600" /> Support Agent Workstation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, <strong>{user?.name}</strong>. Manage your assigned customer support tickets below.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Headset className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{assignedCount}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Assigned Tickets</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Active / In-Progress</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{urgentCount}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">High / Urgent Priority</div>
          </div>
        </div>
      </div>

      {/* Ticket List with Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">Assigned Queue</h2>

          {/* Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
              <Filter size={14} /> Filter:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading queue...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            No tickets currently assigned to you matching filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {ticket.id}
                    </span>
                    <span className="text-xs font-medium text-slate-500">Customer: {ticket.customer_name}</span>
                    <CategoryBadge category={ticket.category} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <Link to={`/tickets/${ticket.id}`} className="text-base font-semibold text-gray-900 hover:text-brand-600 block">
                    {ticket.subject}
                  </Link>
                  <p className="text-sm text-gray-600 line-clamp-1">{ticket.description}</p>
                  <div className="text-xs text-gray-400">
                    Order: #{ticket.order_id} • Created: {new Date(ticket.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end">
                  <StatusBadge status={ticket.status} />
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="inline-flex items-center space-x-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg transition-colors"
                  >
                    <span>Investigate</span>
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
