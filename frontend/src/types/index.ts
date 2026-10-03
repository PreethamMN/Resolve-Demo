export type UserRole = 'CUSTOMER' | 'SUPPORT_AGENT' | 'TEAM_LEAD' | 'ADMIN';

export type TicketCategory =
  | 'ORDER_NOT_RECEIVED'
  | 'WRONG_ITEM'
  | 'DAMAGED_ITEM'
  | 'CANCEL_ORDER'
  | 'REFUND'
  | 'RETURN'
  | 'PAYMENT_ISSUE'
  | 'DELIVERY_ISSUE';

export type TicketStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer_id: string;
  items: OrderItem[];
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  order_date: string;
}

export interface Ticket {
  id: string;
  customer_id: string;
  customer_name?: string;
  order_id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface Attachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  uploaded_by_name: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  ticket_id?: string;
  action: string;
  performed_by_name: string;
  performed_by_role: UserRole;
  details: string;
  created_at: string;
}

export interface SystemStats {
  total_tickets: number;
  new_tickets: number;
  assigned_tickets: number;
  in_progress_tickets: number;
  on_hold_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  tickets_by_category: Record<string, number>;
  tickets_by_agent: Record<string, number>;
  total_customers: number;
  total_agents: number;
}
