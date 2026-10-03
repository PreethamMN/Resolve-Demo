import React from 'react';
import { TicketCategory } from '../types';

export const CategoryBadge: React.FC<{ category: TicketCategory }> = ({ category }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
      🏷️ {category.replace(/_/g, ' ')}
    </span>
  );
};
