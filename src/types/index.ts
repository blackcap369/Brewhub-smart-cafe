// BrewHub Type Definitions
// Aligned with PostgreSQL database schema

// ============================================================================
// DATABASE TYPES (matching Supabase tables)
// ============================================================================

export interface DatabaseCafe {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  subscription_plan: 'free' | 'starter' | 'professional' | 'enterprise';
  settings: Record<string, unknown>;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUser {
  id: string;
  phone: string | null;
  name: string;
  email: string | null;
  dob: string | null;
  role: 'owner' | 'staff' | 'customer';
  cafe_id: string;
  auth_user_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTable {
  id: string;
  cafe_id: string;
  table_no: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  qr_code: string | null;
  label: string | null;
  floor: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMenuItem {
  id: string;
  cafe_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  is_popular: boolean;
  is_spicy: boolean;
  preparation_time: number;
  calories: number | null;
  allergens: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface DatabaseOrder {
  id: string;
  cafe_id: string;
  order_number: string;
  table_no: number | null;
  customer_id: string | null;
  items: DatabaseOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
  order_type: 'dine_in' | 'pre_order';
  scheduled_time: string | null;
  notes: string | null;
  special_instructions: string | null;
  priority: 'normal' | 'high' | 'urgent';
  prepared_by: string | null;
  served_by: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabasePayment {
  id: string;
  order_id: string;
  cafe_id: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'razorpay' | 'wallet' | 'other';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  refund_amount: number;
  refund_reason: string | null;
  transaction_ref: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseLoyaltyPoints {
  id: string;
  customer_id: string;
  cafe_id: string;
  points: number;
  orders_count: number;
  total_spent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  last_redeemed: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseFeedback {
  id: string;
  order_id: string;
  customer_id: string;
  cafe_id: string;
  rating: number;
  comment: string | null;
  food_rating: number | null;
  service_rating: number | null;
  ambiance_rating: number | null;
  is_anonymous: boolean;
  responded_at: string | null;
  response: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBroadcast {
  id: string;
  cafe_id: string;
  title: string;
  message: string;
  target_audience: 'all' | 'loyalty_members' | 'new_customers' | 'inactive';
  channel: 'in_app' | 'push' | 'sms' | 'email' | 'whatsapp';
  media_url: string | null;
  sent_at: string | null;
  scheduled_for: string | null;
  sent_count: number;
  read_count: number;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSettings {
  id: string;
  cafe_id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseActivityLog {
  id: string;
  cafe_id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================================
// APPLICATION TYPES (frontend-facing, simplified)
// ============================================================================

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isVeg: boolean;
  isPopular: boolean;
  isSpicy: boolean;
  preparationTime: number;
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
  priority: 'normal' | 'high' | 'urgent';
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

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';

export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'razorpay' | 'wallet' | 'other';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';

export type OrderType = 'dine_in' | 'pre_order';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  cafeId: string;
  createdAt: string;
}

export type UserRole = 'owner' | 'staff' | 'customer';

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
  totalCustomers: number;
  avgRating: number;
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

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CreateOrderForm {
  tableNo?: number;
  orderType: OrderType;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
  notes?: string;
  scheduledTime?: string;
}

export interface PaymentForm {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  razorpayData?: {
    orderId: string;
    paymentId: string;
    signature: string;
  };
}

export interface FeedbackForm {
  orderId: string;
  rating: number;
  comment?: string;
  foodRating?: number;
  serviceRating?: number;
  ambianceRating?: number;
  isAnonymous: boolean;
}

export interface BroadcastForm {
  title: string;
  message: string;
  targetAudience: 'all' | 'loyalty_members' | 'new_customers' | 'inactive';
  channel: 'in_app' | 'push' | 'sms' | 'email' | 'whatsapp';
  scheduledFor?: string;
}

// ============================================================================
// QR CODE TYPES
// ============================================================================

export interface QRData {
  cafeId: string;
  tableNo: number;
}

export interface QRError {
  error: string;
  code: 'INVALID_URL' | 'MISSING_CAFE' | 'MISSING_TABLE' | 'INVALID_CAFE_ID' | 'INVALID_TABLE_NO';
}
