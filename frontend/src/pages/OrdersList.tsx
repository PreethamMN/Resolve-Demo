import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import { ShoppingBag, Package, DollarSign, Calendar } from 'lucide-react';

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-brand-600" /> Orders Database
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View customer purchase histories and linked support orders.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No orders found.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((ord) => (
              <div key={ord.id} className="p-6 space-y-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="font-mono text-base font-bold text-gray-900">
                      Order #{ord.id}
                    </span>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> Ordered on {new Date(ord.order_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-gray-900">${ord.total_amount.toFixed(2)}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">
                      {ord.payment_status}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">
                      {ord.delivery_status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {ord.items.map((item, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-gray-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-mono font-bold text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
