import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Ticket, Order, Comment, Attachment, AuditLog, User, TicketStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  ArrowLeft, MessageSquare, Paperclip, History, UserCheck, CheckCircle,
  Clock, Shield, Send, Lock, Eye, AlertCircle, ShoppingBag, ExternalLink,
  Download, Image as ImageIcon, X, Upload
} from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'audit'>('comments');
  const [previewModalUrl, setPreviewModalUrl] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isImageFile = (filename: string) => {
    return /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(filename);
  };

  const getFullFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadTicketData();
  }, [id]);

  const loadTicketData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const ticketData = await api.getTicket(id);
      setTicket(ticketData);

      const [commentsData, attachmentsData, auditData] = await Promise.all([
        api.getComments(id),
        api.getAttachments(id),
        api.getAuditLogs(id),
      ]);

      setComments(commentsData);
      setAttachments(attachmentsData);
      setAuditLogs(auditData);

      if (ticketData.order_id) {
        try {
          const orderData = await api.getOrder(ticketData.order_id);
          setOrder(orderData);
        } catch (e) {
          console.error("Order load error", e);
        }
      }

      if (user?.role === 'TEAM_LEAD' || user?.role === 'ADMIN') {
        try {
          const agentsList = await api.getUsers('SUPPORT_AGENT');
          setAgents(agentsList);
          if (ticketData.assigned_agent_id) {
            setSelectedAgentId(ticketData.assigned_agent_id);
          }
        } catch (e) {
          console.error("Agents load error", e);
        }
      }
    } catch (err) {
      console.error("Error loading ticket detail", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!id) return;
    try {
      const updated = await api.updateStatus(id, newStatus);
      setTicket(updated);
      await loadTicketData();
    } catch (err) {
      alert("Failed to update ticket status");
    }
  };

  const handleAssignAgent = async () => {
    if (!id || !selectedAgentId) return;
    try {
      const updated = await api.assignTicket(id, selectedAgentId);
      setTicket(updated);
      await loadTicketData();
    } catch (err) {
      alert("Failed to assign agent");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    setSubmitting(true);
    try {
      await api.addComment(id, newComment, isInternal);
      setNewComment('');
      setIsInternal(false);
      await loadTicketData();
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (file?: File) => {
    const fileToUse = file || fileToUpload;
    if (!id || !fileToUse) return;
    setIsUploading(true);
    try {
      await api.uploadAttachment(id, fileToUse);
      setFileToUpload(null);
      await loadTicketData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading ticket workspace...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-red-500">Ticket not found</div>;
  }

  const isStaff = user?.role === 'SUPPORT_AGENT' || user?.role === 'TEAM_LEAD' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-3">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {/* Main Ticket Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {ticket.id}
              </span>
              <CategoryBadge category={ticket.category} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {user?.role === 'CUSTOMER' && ticket.status === 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange('CLOSED')}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <CheckCircle size={16} /> Confirm & Close Ticket
              </button>
            )}

            {isStaff && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Set Status:</span>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-gray-50 text-gray-800"
                >
                  <option value="NEW">NEW</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Customer description */}
        <div className="text-sm text-gray-700 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Customer Description ({ticket.customer_name})
          </div>
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Comments & Audit Log Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'comments'
                    ? 'border-brand-600 text-brand-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare size={16} /> Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'audit'
                    ? 'border-brand-600 text-brand-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <History size={16} /> Audit Trail ({auditLogs.length})
              </button>
            </div>

            {/* Comments Tab View */}
            {activeTab === 'comments' && (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-500">
                      No comments yet. Start the conversation below.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-xl border ${
                          comment.is_internal
                            ? 'bg-amber-50 border-amber-200'
                            : comment.user_role === 'CUSTOMER'
                            ? 'bg-blue-50/50 border-blue-100'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">{comment.user_name}</span>
                            <span className="text-xs px-2 py-0.5 rounded font-mono bg-gray-200 text-gray-700">
                              {comment.user_role}
                            </span>
                            {comment.is_internal && (
                              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-amber-200 text-amber-900 flex items-center gap-1">
                                <Lock size={12} /> Internal Note
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="pt-4 border-t border-gray-200 space-y-3">
                  {isStaff && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 cursor-pointer bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <Lock size={14} /> Internal Note (Visible only to Support Staff)
                      </label>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isInternal ? "Write internal investigation note..." : "Write customer response..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                    required
                  />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                        <Paperclip size={14} /> Attach File
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFileToUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      {fileToUpload && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{fileToUpload.name}</span>
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => handleFileUpload()}
                            className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-2 py-1 rounded"
                          >
                            {isUploading ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
                    >
                      <Send size={14} />
                      {submitting ? 'Posting...' : 'Post Response'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Audit Trail Tab View */}
            {activeTab === 'audit' && (
              <div className="p-6">
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 py-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-brand-600 ring-4 ring-white" />
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm text-gray-900 capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                      <div className="text-xs text-slate-400 mt-1">
                        By <strong className="text-slate-600">{log.performed_by_name}</strong> ({log.performed_by_role})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Details & Assignment */}
        <div className="space-y-6">
          {/* Order Details Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <ShoppingBag size={18} className="text-brand-600" /> Order Details
            </h2>

            {order ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono font-semibold text-gray-900">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-bold text-gray-900">${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                    {order.payment_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Status:</span>
                  <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                    {order.delivery_status}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Order Items:</div>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs bg-gray-50 p-2 rounded border border-gray-100">
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-gray-500">Qty: {item.quantity}</div>
                        </div>
                        <div className="font-mono font-medium text-gray-700">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Order information linked: #{ticket.order_id}</div>
            )}
          </div>

          {/* Ticket Metadata Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Ticket Metadata
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-900">{ticket.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Assigned Agent:</span>
                <span className="font-semibold text-brand-600">
                  {ticket.assigned_agent_name || 'Unassigned'}
                </span>
              </div>

              {/* Assignment control for Lead / Admin */}
              {(user?.role === 'TEAM_LEAD' || user?.role === 'ADMIN') && (
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Reassign Support Agent:</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                    >
                      <option value="">Select Agent...</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>{ag.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignAgent}
                      className="bg-brand-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-brand-700"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-700">{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated:</span>
                <span className="text-gray-700">{new Date(ticket.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Attachments list */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Paperclip size={16} /> Attachments ({attachments.length})
              </h2>
              <label className="cursor-pointer bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <Upload size={13} />
                <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  className="hidden"
                  disabled={isUploading}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) {
                      handleFileUpload(selected);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <ImageIcon className="mx-auto text-gray-400 mb-1" size={24} />
                <div className="text-xs text-gray-500">No photos or files uploaded yet.</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Click "Upload" to add photos or documents.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {attachments.map((att) => {
                  const isImg = isImageFile(att.file_name);
                  const fullUrl = getFullFileUrl(att.file_url);

                  return (
                    <div
                      key={att.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors space-y-2"
                    >
                      {/* Image Thumbnail Preview */}
                      {isImg ? (
                        <div
                          onClick={() => setPreviewModalUrl({ url: fullUrl, name: att.file_name })}
                          className="cursor-pointer overflow-hidden rounded border border-gray-200 bg-black/5 hover:opacity-90 relative group max-h-36 flex items-center justify-center"
                        >
                          <img
                            src={fullUrl}
                            alt={att.file_name}
                            className="w-full h-32 object-cover object-center"
                            onError={(e) => {
                              // If image fails to load, show icon fallback
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                            <Eye size={16} /> Click to Expand
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <div className="font-medium text-gray-900 truncate" title={att.file_name}>
                            {att.file_name}
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1">
                            <span>By {att.uploaded_by_name}</span>
                            <span>•</span>
                            <span>{new Date(att.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded transition-colors font-medium shrink-0"
                        >
                          <ExternalLink size={12} /> View
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Full-size Photo Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="font-semibold text-sm text-gray-800 truncate pr-4">{previewModalUrl.name}</span>
              <div className="flex items-center gap-3">
                <a
                  href={previewModalUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  <ExternalLink size={14} /> Open Original
                </a>
                <button
                  onClick={() => setPreviewModalUrl(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-900/5 max-h-[calc(90vh-60px)] overflow-auto">
              <img
                src={previewModalUrl.url}
                alt={previewModalUrl.name}
                className="max-h-[75vh] max-w-full rounded object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
