// BrewHub Type Definitions

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderType: OrderType;
  tableNumber?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedReadyAt?: string;
  completedAt?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
  status: OrderItemStatus;
  price: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type OrderItemStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'served';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'razorpay';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

export interface KitchenTicket {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  orderType: OrderType;
  tableNumber?: number;
  createdAt: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
