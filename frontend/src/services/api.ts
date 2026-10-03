import axios from 'axios';
import {
  User, Order, Ticket, Comment, Attachment, AuditLog, SystemStats,
  TicketCategory, TicketStatus, TicketPriority, UserRole
} from '../types';

const API_URL = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await client.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string, role: UserRole) => {
    const res = await client.post('/auth/register', { name, email, password, role });
    return res.data;
  },
  getMe: async () => {
    const res = await client.get('/auth/me');
    return res.data;
  },

  // Users
  getUsers: async (role?: string) => {
    const res = await client.get('/users', { params: { role } });
    return res.data;
  },
  createUser: async (userData: any) => {
    const res = await client.post('/users', userData);
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await client.delete(`/users/${id}`);
    return res.data;
  },

  // Orders
  getOrders: async () => {
    const res = await client.get('/orders');
    return res.data;
  },
  getMyOrders: async () => {
    const res = await client.get('/customers/me/orders');
    return res.data;
  },
  getOrder: async (id: string) => {
    const res = await client.get(`/orders/${id}`);
    return res.data;
  },

  // Tickets
  getTickets: async (params?: { status?: string; category?: string; priority?: string; agent_id?: string }) => {
    const res = await client.get('/tickets', { params });
    return res.data;
  },
  getTicket: async (id: string) => {
    const res = await client.get(`/tickets/${id}`);
    return res.data;
  },
  createTicket: async (ticketData: { order_id: string; category: TicketCategory; subject: string; description: string; priority?: TicketPriority }) => {
    const res = await client.post('/tickets', ticketData);
    return res.data;
  },
  assignTicket: async (id: string, agent_id: string) => {
    const res = await client.post(`/tickets/${id}/assign`, { agent_id });
    return res.data;
  },
  updateStatus: async (id: string, status: TicketStatus) => {
    const res = await client.post(`/tickets/${id}/status`, { status });
    return res.data;
  },

  // Comments
  getComments: async (ticketId: string) => {
    const res = await client.get(`/tickets/${ticketId}/comments`);
    return res.data;
  },
  addComment: async (ticketId: string, message: string, is_internal: boolean = false) => {
    const res = await client.post(`/tickets/${ticketId}/comments`, { message, is_internal });
    return res.data;
  },

  // Attachments
  getAttachments: async (ticketId: string) => {
    const res = await client.get(`/tickets/${ticketId}/attachments`);
    return res.data;
  },
  uploadAttachment: async (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post(`/tickets/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Audit Logs & Stats
  getAuditLogs: async (ticketId?: string) => {
    const url = ticketId ? `/tickets/${ticketId}/audit-logs` : '/audit-logs';
    const res = await client.get(url);
    return res.data;
  },
  getStats: async () => {
    const res = await client.get('/stats');
    return res.data;
  },
};
