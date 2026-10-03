import React from 'react';
import { TicketPriority } from '../types';

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const styles: Record<TicketPriority, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-orange-50 text-orange-700 font-medium',
    URGENT: 'bg-red-100 text-red-700 font-bold animate-pulse',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${styles[priority]}`}>
      {priority}
    </span>
  );
};
