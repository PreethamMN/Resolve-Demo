import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, User, SystemStats } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { Users, UserPlus, BarChart3, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export const TeamLeadDashboard: React.FC = () => {
  const [unassignedTickets, setUnassignedTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [selectedAgentMap, setSelectedAgentMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeadData();
  }, []);

  const loadLeadData = async () => {
    setLoading(true);
    try {
      const [ticketsData, agentsData, statsData] = await Promise.all([
        api.getTickets(),
        api.getUsers('SUPPORT_AGENT'),
        api.getStats(),
      ]);

      setAllTickets(ticketsData);
      setUnassignedTickets(ticketsData.filter((t: Ticket) => !t.assigned_agent_id));
      setAgents(agentsData);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading team lead workspace", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (ticketId: string) => {
    const agentId = selectedAgentMap[ticketId];
    if (!agentId) {
      alert("Please select an agent to assign.");
      return;
    }
    try {
      await api.assignTicket(ticketId, agentId);
      await loadLeadData();
    } catch (err) {
      alert("Failed to assign agent");
    }
  };

  return (
    <div className="space-y-6">
      {/* Lead Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-purple-600" /> Support Team Lead Command Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign incoming tickets, balance agent workloads, and monitor ticket lifecycle metrics.
          </p>
        </div>
      </div>

      {/* Analytics Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase">Total Tickets</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{stats.total_tickets}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-100 bg-purple-50/50 shadow-sm">
            <div className="text-xs font-semibold text-purple-600 uppercase">New / Unassigned</div>
            <div className="text-2xl font-extrabold text-purple-700 mt-1">{unassignedTickets.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/50 shadow-sm">
            <div className="text-xs font-semibold text-amber-600 uppercase">In Progress</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{stats.in_progress_tickets}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 shadow-sm">
            <div className="text-xs font-semibold text-emerald-600 uppercase">Resolved / Closed</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.resolved_tickets + stats.closed_tickets}</div>
          </div>
        </div>
      )}

      {/* Unassigned Tickets Queue */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserPlus size={20} className="text-purple-600" /> Unassigned Tickets Queue ({unassignedTickets.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading unassigned queue...</div>
        ) : unassignedTickets.length === 0 ? (
          <div className="p-8 text-center text-emerald-600 font-medium">
            🎉 All incoming tickets have been assigned to agents!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {unassignedTickets.map((t) => (
              <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {t.id}
                    </span>
                    <CategoryBadge category={t.category} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <Link to={`/tickets/${t.id}`} className="font-semibold text-gray-900 hover:text-purple-600 block">
                    {t.subject}
                  </Link>
                  <div className="text-xs text-gray-500">
                    Customer: {t.customer_name} • Order: #{t.order_id}
                  </div>
                </div>

                {/* Assignment Controls */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAgentMap[t.id] || ''}
                    onChange={(e) => setSelectedAgentMap({ ...selectedAgentMap, [t.id]: e.target.value })}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium"
                  >
                    <option value="">Select Agent...</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>{ag.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssign(t.id)}
                    className="bg-purple-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700"
                  >
                    Assign Agent
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Workload Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-600" /> Agent Workload & Assignment Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((ag) => {
            const agentTickets = allTickets.filter(t => t.assigned_agent_id === ag.id);
            const activeCount = agentTickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;

            return (
              <div key={ag.id} className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-gray-900 text-sm">{ag.name}</div>
                  <span className="text-xs font-mono text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    {ag.email}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Active Load:</span>
                  <span className="font-bold text-purple-700">{activeCount} tickets</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Assigned:</span>
                  <span className="font-semibold text-gray-800">{agentTickets.length} tickets</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
