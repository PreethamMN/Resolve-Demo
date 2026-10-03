import React, { useEffect, useState } from 'react';
import { User, AuditLog, SystemStats, UserRole } from '../types';
import { api } from '../services/api';
import { Shield, Users, History, Activity, Trash2, UserPlus, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SUPPORT_AGENT');
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'categories'>('users');

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, auditData, statsData] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs(),
        api.getStats(),
      ]);

      setUsers(usersData);
      setAuditLogs(auditData);
      setStats(statsData);
    } catch (err) {
      console.error("Admin data load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createUser({ name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');
      await loadAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteUser(id);
      await loadAdminData();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const categories = [
    'ORDER_NOT_RECEIVED', 'WRONG_ITEM', 'DAMAGED_ITEM', 'CANCEL_ORDER',
    'REFUND', 'RETURN', 'PAYMENT_ISSUE', 'DELIVERY_ISSUE'
  ];

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-rose-600" /> Admin System Control Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage user authorization, ticket categories, system configuration, and compliance audit logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 ${
            activeTab === 'users'
              ? 'border-rose-600 text-rose-600 bg-rose-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} /> User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 ${
            activeTab === 'audit'
              ? 'border-rose-600 text-rose-600 bg-rose-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} /> Audit Trail ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 ${
            activeTab === 'categories'
              ? 'border-rose-600 text-rose-600 bg-rose-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity size={16} /> Ticket Categories
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Registered Accounts</h2>
            <div className="divide-y divide-gray-200">
              {users.map((u) => (
                <div key={u.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {u.role}
                    </span>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create User Form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserPlus size={18} className="text-rose-600" /> Create System User
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="SUPPORT_AGENT">Support Agent</option>
                  <option value="TEAM_LEAD">Support Team Lead</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-rose-600 text-white font-medium py-2 rounded text-sm hover:bg-rose-700"
              >
                {creating ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-900 capitalize mr-2">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-gray-600">{log.details}</span>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Performed by: {log.performed_by_name} ({log.performed_by_role})
                  </div>
                </div>
                <div className="text-gray-400 text-[11px]">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Supported System Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <div key={cat} className="p-3 bg-slate-100 rounded-lg text-xs font-mono font-semibold text-slate-800 border border-slate-200 text-center">
                🏷️ {cat}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
