import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Ticket, PlusCircle, ShoppingBag, 
  CheckSquare, Users, ShieldAlert, BarChart3, Settings
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const customerLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets/new', label: 'Create Ticket', icon: PlusCircle },
    { to: '/orders', label: 'My Orders', icon: ShoppingBag },
  ];

  const agentLinks = [
    { to: '/', label: 'Agent Workstation', icon: LayoutDashboard },
    { to: '/orders', label: 'Order Explorer', icon: ShoppingBag },
  ];

  const teamLeadLinks = [
    { to: '/', label: 'Lead Command Center', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders Overview', icon: ShoppingBag },
  ];

  const adminLinks = [
    { to: '/', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'System Orders', icon: ShoppingBag },
  ];

  let links = customerLinks;
  if (role === 'SUPPORT_AGENT') links = agentLinks;
  if (role === 'TEAM_LEAD') links = teamLeadLinks;
  if (role === 'ADMIN') links = adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
