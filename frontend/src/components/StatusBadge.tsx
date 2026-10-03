import React from 'react';
import { TicketStatus } from '../types';

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const styles: Record<TicketStatus, string> = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-200',
    ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
    ON_HOLD: 'bg-orange-100 text-orange-800 border-orange-200',
    RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {status.replace('_', ' ')}
    </span>
  );
};
