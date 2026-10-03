import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, TicketCategory, TicketPriority } from '../types';
import { api } from '../services/api';
import { LifeBuoy, ArrowLeft, Upload, AlertCircle, Trash2, Image as ImageIcon } from 'lucide-react';

export const CreateTicket: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [category, setCategory] = useState<TicketCategory>('WRONG_ITEM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const categories: { value: TicketCategory; label: string }[] = [
    { value: 'ORDER_NOT_RECEIVED', label: 'Order Not Received' },
    { value: 'WRONG_ITEM', label: 'Wrong Item Delivered' },
    { value: 'DAMAGED_ITEM', label: 'Damaged / Defective Item' },
    { value: 'CANCEL_ORDER', label: 'Order Cancellation Request' },
    { value: 'REFUND', label: 'Refund Inquiry' },
    { value: 'RETURN', label: 'Product Return Request' },
    { value: 'PAYMENT_ISSUE', label: 'Payment Problem' },
    { value: 'DELIVERY_ISSUE', label: 'Delivery Delay / Shipping Issue' },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getMyOrders();
        setOrders(data);
        if (data.length > 0) {
          setSelectedOrderId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load customer orders", err);
      }
    };
    fetchOrders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError('Please select an order associated with your ticket.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const ticket = await api.createTicket({
        order_id: selectedOrderId,
        category,
        subject,
        description,
        priority
      });

      if (file) {
        try {
          await api.uploadAttachment(ticket.id, file);
        } catch (uploadErr) {
          console.error("Attachment upload failed", uploadErr);
        }
      }

      navigate(`/tickets/${ticket.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="text-brand-600" /> Create Support Ticket
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit a problem report for your order. Our support team will investigate and respond promptly.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Order Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Related Order <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
              required
            >
              {orders.length === 0 ? (
                <option value="">No orders found</option>
              ) : (
                orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    Order #{ord.id} - ${ord.total_amount.toFixed(2)} ({ord.delivery_status})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Issue Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
              required
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Priority Urgency
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="LOW">Low - Minor question</option>
              <option value="MEDIUM">Medium - Standard issue</option>
              <option value="HIGH">High - Important order issue</option>
              <option value="URGENT">Urgent - Immediate attention required</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide specific details about what went wrong, items affected, or questions..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Optional Attachment (Photo / Invoice / Screenshot)
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 font-medium flex items-center gap-2 transition-colors">
                  <Upload size={16} />
                  <span>Choose File / Photo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] || null;
                      setFile(selected);
                      if (selected && selected.type.startsWith('image/')) {
                        setFilePreview(URL.createObjectURL(selected));
                      } else {
                        setFilePreview(null);
                      }
                    }}
                  />
                </label>
                <span className="text-xs text-gray-500">
                  {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'No file selected'}
                </span>
                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>

              {filePreview && (
                <div className="relative inline-block border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    <ImageIcon size={14} /> Image Preview:
                  </div>
                  <img
                    src={filePreview}
                    alt="Selected attachment preview"
                    className="max-h-48 max-w-full rounded-md object-contain border border-gray-300"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm shadow-sm"
            >
              {loading ? 'Submitting Ticket...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
