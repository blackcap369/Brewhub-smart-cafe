import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Table2,
  Key,
  Link2,
  Shield,
  Zap,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Search,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPK: boolean;
  isFK: boolean;
  fkRef?: string;
  default?: string;
  constraint?: string;
}

interface TableSchema {
  name: string;
  description: string;
  columns: Column[];
  rlsEnabled: boolean;
  indexes: string[];
  policies: string[];
}

const schemaData: TableSchema[] = [
  {
    name: 'cafes',
    description: 'Core tenant table — each cafe is an isolated multi-tenant unit',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'name', type: 'TEXT', nullable: false, isPK: false, isFK: false },
      { name: 'slug', type: 'TEXT', nullable: false, isPK: false, isFK: false, constraint: 'UNIQUE' },
      { name: 'owner_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'auth.users(id)' },
      { name: 'subscription_plan', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'free'", constraint: "CHECK (free/starter/professional/enterprise)" },
      { name: 'settings', type: 'JSONB', nullable: true, isPK: false, isFK: false, default: "'{}'" },
      { name: 'logo_url', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'address', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'phone', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'timezone', type: 'TEXT', nullable: true, isPK: false, isFK: false, default: "'UTC'" },
      { name: 'currency', type: 'TEXT', nullable: true, isPK: false, isFK: false, default: "'USD'" },
      { name: 'is_active', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'true' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: [],
    policies: ['cafes_select_owner', 'cafes_insert_owner', 'cafes_update_owner', 'cafes_delete_owner', 'cafes_select_staff'],
  },
  {
    name: 'users',
    description: 'All users across tenants — owners, staff, and customers',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'phone', type: 'TEXT', nullable: true, isPK: false, isFK: false, constraint: 'UNIQUE' },
      { name: 'name', type: 'TEXT', nullable: false, isPK: false, isFK: false },
      { name: 'email', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'dob', type: 'DATE', nullable: true, isPK: false, isFK: false },
      { name: 'role', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'customer'", constraint: "CHECK (owner/staff/customer)" },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'auth_user_id', type: 'UUID', nullable: true, isPK: false, isFK: true, fkRef: 'auth.users(id)' },
      { name: 'avatar_url', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'is_active', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'true' },
      { name: 'last_login_at', type: 'TIMESTAMPTZ', nullable: true, isPK: false, isFK: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_users_phone', 'idx_users_cafe_id', 'idx_users_role', 'idx_users_auth'],
    policies: ['users_select_staff', 'users_select_own', 'users_insert_staff', 'users_update_staff', 'users_update_own', 'users_delete_owner'],
  },
  {
    name: 'tables',
    description: 'Physical tables in each cafe with QR code support',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'table_no', type: 'INT', nullable: false, isPK: false, isFK: false },
      { name: 'seats', type: 'INT', nullable: false, isPK: false, isFK: false, default: '4', constraint: 'CHECK (> 0)' },
      { name: 'status', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'available'", constraint: "CHECK (available/occupied/reserved/maintenance)" },
      { name: 'qr_code', type: 'TEXT', nullable: true, isPK: false, isFK: false, constraint: 'UNIQUE' },
      { name: 'label', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'floor', type: 'TEXT', nullable: true, isPK: false, isFK: false, default: "'ground'" },
      { name: 'is_active', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'true' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_tables_cafe_id', 'idx_tables_status'],
    policies: ['tables_select_tenant', 'tables_insert_tenant', 'tables_update_tenant', 'tables_delete_tenant'],
  },
  {
    name: 'menu_items',
    description: 'Menu items per cafe — tenant-isolated with rich metadata',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'name', type: 'TEXT', nullable: false, isPK: false, isFK: false },
      { name: 'description', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'price', type: 'DECIMAL(10,2)', nullable: false, isPK: false, isFK: false, constraint: 'CHECK (>= 0)' },
      { name: 'category', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'general'" },
      { name: 'image_url', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'is_veg', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'false' },
      { name: 'is_available', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'true' },
      { name: 'is_popular', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'false' },
      { name: 'is_spicy', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'false' },
      { name: 'preparation_time', type: 'INT', nullable: true, isPK: false, isFK: false, default: '10' },
      { name: 'calories', type: 'INT', nullable: true, isPK: false, isFK: false },
      { name: 'allergens', type: 'TEXT[]', nullable: true, isPK: false, isFK: false, default: "'{}'" },
      { name: 'sort_order', type: 'INT', nullable: true, isPK: false, isFK: false, default: '0' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_menu_items_cafe_id', 'idx_menu_items_category', 'idx_menu_items_available', 'idx_menu_items_popular'],
    policies: ['menu_items_select_public', 'menu_items_insert_staff', 'menu_items_update_staff', 'menu_items_delete_staff'],
  },
  {
    name: 'orders',
    description: 'Orders with full status workflow and JSONB line items',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'order_number', type: 'TEXT', nullable: false, isPK: false, isFK: false, constraint: 'AUTO-GENERATED' },
      { name: 'table_no', type: 'INT', nullable: true, isPK: false, isFK: false },
      { name: 'customer_id', type: 'UUID', nullable: true, isPK: false, isFK: true, fkRef: 'users(id)' },
      { name: 'items', type: 'JSONB', nullable: false, isPK: false, isFK: false, default: "'[]'" },
      { name: 'subtotal', type: 'DECIMAL(10,2)', nullable: false, isPK: false, isFK: false, default: '0' },
      { name: 'tax', type: 'DECIMAL(10,2)', nullable: false, isPK: false, isFK: false, default: '0' },
      { name: 'discount', type: 'DECIMAL(10,2)', nullable: true, isPK: false, isFK: false, default: '0' },
      { name: 'total', type: 'DECIMAL(10,2)', nullable: false, isPK: false, isFK: false, default: '0' },
      { name: 'status', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'received'", constraint: "CHECK (received/preparing/ready/served/cancelled)" },
      { name: 'payment_status', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'pending'", constraint: "CHECK (pending/paid/failed/refunded/partial)" },
      { name: 'order_type', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'dine_in'", constraint: "CHECK (dine_in/pre_order)" },
      { name: 'scheduled_time', type: 'TIMESTAMPTZ', nullable: true, isPK: false, isFK: false },
      { name: 'notes', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'priority', type: 'TEXT', nullable: true, isPK: false, isFK: false, default: "'normal'", constraint: "CHECK (normal/high/urgent)" },
      { name: 'prepared_by', type: 'UUID', nullable: true, isPK: false, isFK: true, fkRef: 'users(id)' },
      { name: 'served_by', type: 'UUID', nullable: true, isPK: false, isFK: true, fkRef: 'users(id)' },
      { name: 'completed_at', type: 'TIMESTAMPTZ', nullable: true, isPK: false, isFK: false },
      { name: 'cancelled_at', type: 'TIMESTAMPTZ', nullable: true, isPK: false, isFK: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_orders_cafe_id', 'idx_orders_cafe_status', 'idx_orders_created_at', 'idx_orders_cafe_created', 'idx_orders_customer', 'idx_orders_status_active', 'idx_orders_number'],
    policies: ['orders_select_staff', 'orders_select_customer', 'orders_insert_staff', 'orders_update_staff', 'orders_delete_owner'],
  },
  {
    name: 'payments',
    description: 'Payment records with Razorpay integration fields',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'order_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'orders(id)' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'amount', type: 'DECIMAL(10,2)', nullable: false, isPK: false, isFK: false, constraint: 'CHECK (>= 0)' },
      { name: 'method', type: 'TEXT', nullable: false, isPK: false, isFK: false, constraint: "CHECK (cash/card/upi/razorpay/wallet/other)" },
      { name: 'razorpay_order_id', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'razorpay_payment_id', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'razorpay_signature', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'status', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'pending'", constraint: "CHECK (pending/authorized/captured/failed/refunded)" },
      { name: 'refund_amount', type: 'DECIMAL(10,2)', nullable: true, isPK: false, isFK: false, default: '0' },
      { name: 'metadata', type: 'JSONB', nullable: true, isPK: false, isFK: false, default: "'{}'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_payments_order_id', 'idx_payments_cafe_id', 'idx_payments_razorpay', 'idx_payments_status'],
    policies: ['payments_select_staff', 'payments_select_customer', 'payments_insert_staff', 'payments_update_staff'],
  },
  {
    name: 'loyalty_points',
    description: 'Customer loyalty tracking with tier system',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'customer_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'users(id)' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'points', type: 'INT', nullable: false, isPK: false, isFK: false, default: '0', constraint: 'CHECK (>= 0)' },
      { name: 'orders_count', type: 'INT', nullable: false, isPK: false, isFK: false, default: '0' },
      { name: 'total_spent', type: 'DECIMAL(12,2)', nullable: true, isPK: false, isFK: false, default: '0' },
      { name: 'tier', type: 'TEXT', nullable: true, isPK: false, isFK: false, default: "'bronze'", constraint: "CHECK (bronze/silver/gold/platinum)" },
      { name: 'last_redeemed', type: 'TIMESTAMPTZ', nullable: true, isPK: false, isFK: false },
      { name: 'expires_at', type: 'TIMESTAMPTZ', nullable: true, isPK: false, isFK: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_loyalty_customer', 'idx_loyalty_cafe', 'idx_loyalty_tier'],
    policies: ['loyalty_select_staff', 'loyalty_select_own', 'loyalty_insert_staff', 'loyalty_update_staff'],
  },
  {
    name: 'feedback',
    description: 'Customer feedback with multi-dimensional ratings',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'order_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'orders(id)', constraint: 'UNIQUE' },
      { name: 'customer_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'users(id)' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'rating', type: 'INT', nullable: false, isPK: false, isFK: false, constraint: 'CHECK (1-5)' },
      { name: 'comment', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'food_rating', type: 'INT', nullable: true, isPK: false, isFK: false, constraint: 'CHECK (1-5)' },
      { name: 'service_rating', type: 'INT', nullable: true, isPK: false, isFK: false, constraint: 'CHECK (1-5)' },
      { name: 'ambiance_rating', type: 'INT', nullable: true, isPK: false, isFK: false, constraint: 'CHECK (1-5)' },
      { name: 'is_anonymous', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'false' },
      { name: 'response', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'responded_by', type: 'UUID', nullable: true, isPK: false, isFK: true, fkRef: 'users(id)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_feedback_order', 'idx_feedback_customer', 'idx_feedback_cafe', 'idx_feedback_rating'],
    policies: ['feedback_select_staff', 'feedback_select_own', 'feedback_insert_customer', 'feedback_update_staff'],
  },
  {
    name: 'broadcasts',
    description: 'Cafe announcements and promotional broadcasts',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'title', type: 'TEXT', nullable: false, isPK: false, isFK: false },
      { name: 'message', type: 'TEXT', nullable: false, isPK: false, isFK: false },
      { name: 'target_audience', type: 'TEXT', nullable: false, isPK: false, isFK: false, default: "'all'", constraint: "CHECK (all/loyalty_members/new_customers/inactive)" },
      { name: 'channel', type: 'TEXT', nullable: true, isPK: false, isFK: false, default: "'in_app'", constraint: "CHECK (in_app/push/sms/email/whatsapp)" },
      { name: 'media_url', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'sent_at', type: 'TIMESTAMPTZ', nullable: true, isPK: false, isFK: false },
      { name: 'scheduled_for', type: 'TIMESTAMPTZ', nullable: true, isPK: false, isFK: false },
      { name: 'sent_count', type: 'INT', nullable: true, isPK: false, isFK: false, default: '0' },
      { name: 'read_count', type: 'INT', nullable: true, isPK: false, isFK: false, default: '0' },
      { name: 'status', type: 'TEXT', nullable: true, isPK: false, isFK: false, default: "'draft'", constraint: "CHECK (draft/scheduled/sent/cancelled)" },
      { name: 'created_by', type: 'UUID', nullable: true, isPK: false, isFK: true, fkRef: 'users(id)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_broadcasts_cafe', 'idx_broadcasts_status', 'idx_broadcasts_scheduled'],
    policies: ['broadcasts_select_tenant', 'broadcasts_select_sent', 'broadcasts_insert_staff', 'broadcasts_update_staff', 'broadcasts_delete_owner'],
  },
  {
    name: 'settings',
    description: 'Per-cafe key-value settings store (JSONB values)',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)', constraint: 'UNIQUE per key' },
      { name: 'key', type: 'TEXT', nullable: false, isPK: false, isFK: false },
      { name: 'value', type: 'JSONB', nullable: false, isPK: false, isFK: false, default: "'{}'" },
      { name: 'description', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'is_public', type: 'BOOLEAN', nullable: true, isPK: false, isFK: false, default: 'false' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_settings_cafe', 'idx_settings_key'],
    policies: ['settings_select_tenant', 'settings_insert_owner', 'settings_update_owner', 'settings_delete_owner'],
  },
  {
    name: 'activity_log',
    description: 'Immutable audit trail for all actions across the system',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPK: true, isFK: false, default: 'uuid_generate_v4()' },
      { name: 'cafe_id', type: 'UUID', nullable: false, isPK: false, isFK: true, fkRef: 'cafes(id)' },
      { name: 'user_id', type: 'UUID', nullable: true, isPK: false, isFK: true, fkRef: 'users(id)' },
      { name: 'action', type: 'TEXT', nullable: false, isPK: false, isFK: false },
      { name: 'entity_type', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'entity_id', type: 'UUID', nullable: true, isPK: false, isFK: false },
      { name: 'details', type: 'JSONB', nullable: true, isPK: false, isFK: false, default: "'{}'" },
      { name: 'ip_address', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'user_agent', type: 'TEXT', nullable: true, isPK: false, isFK: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, isPK: false, isFK: false, default: 'NOW()' },
    ],
    indexes: ['idx_activity_cafe', 'idx_activity_user', 'idx_activity_created', 'idx_activity_action', 'idx_activity_entity'],
    policies: ['activity_select_staff', 'activity_insert_staff'],
  },
];

const typeColors: Record<string, string> = {
  UUID: 'bg-purple-100 text-purple-700',
  TEXT: 'bg-blue-100 text-blue-700',
  INT: 'bg-emerald-100 text-emerald-700',
  BOOLEAN: 'bg-amber-100 text-amber-700',
  JSONB: 'bg-pink-100 text-pink-700',
  TIMESTAMPTZ: 'bg-cyan-100 text-cyan-700',
  DATE: 'bg-indigo-100 text-indigo-700',
  'DECIMAL(10,2)': 'bg-orange-100 text-orange-700',
  'DECIMAL(12,2)': 'bg-orange-100 text-orange-700',
  'TEXT[]': 'bg-violet-100 text-violet-700',
};

function getTypeColor(type: string): string {
  return typeColors[type] || 'bg-gray-100 text-gray-700';
}

export default function SchemaDocs() {
  const [expandedTable, setExpandedTable] = useState<string | null>('cafes');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [showRLSOnly, setShowRLSOnly] = useState(false);

  const filteredTables = schemaData.filter((table) => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.columns.some((col) => col.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRLS = !showRLSOnly || table.rlsEnabled;
    return matchesSearch && matchesRLS;
  });

  const copySQL = (tableName: string) => {
    const table = schemaData.find((t) => t.name === tableName);
    if (!table) return;
    
    const sql = `-- ${table.name} table\nCREATE TABLE ${table.name} (\n${table.columns.map((col) => `  ${col.name} ${col.type}${col.isPK ? ' PRIMARY KEY' : ''}${!col.nullable && !col.isPK ? ' NOT NULL' : ''}${col.default ? ` DEFAULT ${col.default}` : ''}${col.constraint ? ` ${col.constraint}` : ''}`).join(',\n')}\n);\n\n-- RLS\nALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;`;
    
    navigator.clipboard.writeText(sql);
    setCopiedTable(tableName);
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const totalColumns = schemaData.reduce((sum, t) => sum + t.columns.length, 0);
  const totalIndexes = schemaData.reduce((sum, t) => sum + t.indexes.length, 0);
  const totalPolicies = schemaData.reduce((sum, t) => sum + t.policies.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Database Schema</h1>
                <p className="text-gray-400 text-sm">BrewHub Multi-Tenant PostgreSQL Architecture</p>
              </div>
            </div>
            <p className="text-gray-300 max-w-2xl leading-relaxed">
              Complete PostgreSQL schema designed for Supabase with Row Level Security (RLS),
              tenant isolation via <code className="px-1.5 py-0.5 bg-gray-700 rounded text-primary-300 text-xs">cafe_id</code>, 
              and comprehensive indexing strategy.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { label: 'Tables', value: schemaData.length, icon: Table2 },
                { label: 'Columns', value: totalColumns, icon: Key },
                { label: 'Indexes', value: totalIndexes, icon: Zap },
                { label: 'RLS Policies', value: totalPolicies, icon: Shield },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <stat.icon className="w-5 h-5 text-primary-400 mb-2" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tables, columns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <button
              onClick={() => setShowRLSOnly(!showRLSOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showRLSOnly
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showRLSOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              RLS Only
            </button>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-3">
          {filteredTables.map((table, idx) => (
            <motion.div
              key={table.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Table Header */}
              <button
                onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    table.rlsEnabled ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <Table2 className={`w-4.5 h-4.5 ${table.rlsEnabled ? 'text-emerald-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{table.name}</h3>
                      {table.rlsEnabled && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-md border border-emerald-200">
                          <Lock className="w-3 h-3" />
                          RLS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{table.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {table.columns.length} cols · {table.indexes.length} idx · {table.policies.length} policies
                  </span>
                  {expandedTable === table.name ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedTable === table.name && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100 overflow-hidden"
                  >
                    {/* Columns Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Column</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Constraints</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Default</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">References</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {table.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-gray-50/50">
                              <td className="px-5 py-2.5">
                                <div className="flex items-center gap-2">
                                  {col.isPK && <Key className="w-3.5 h-3.5 text-amber-500" />}
                                  {col.isFK && <Link2 className="w-3.5 h-3.5 text-blue-500" />}
                                  <span className={`font-mono text-xs ${col.isPK ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                    {col.name}
                                  </span>
                                  {!col.nullable && !col.isPK && (
                                    <span className="text-[9px] text-red-500 font-medium">NN</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(col.type)}`}>
                                  {col.type}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 hidden sm:table-cell">
                                {col.constraint && (
                                  <span className="text-[11px] text-gray-500 font-mono">{col.constraint}</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 hidden md:table-cell">
                                {col.default && (
                                  <span className="text-[11px] text-gray-400 font-mono">{col.default}</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 hidden lg:table-cell">
                                {col.fkRef && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-mono">
                                    <Link2 className="w-3 h-3" />
                                    {col.fkRef}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Indexes & Policies */}
                    <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {table.indexes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            Indexes ({table.indexes.length})
                          </h4>
                          <div className="space-y-1">
                            {table.indexes.map((idx) => (
                              <code key={idx} className="block text-[11px] text-gray-600 font-mono bg-white px-2 py-1 rounded border border-gray-100">
                                {idx}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                      {table.policies.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            RLS Policies ({table.policies.length})
                          </h4>
                          <div className="space-y-1">
                            {table.policies.map((policy) => (
                              <code key={policy} className="block text-[11px] text-gray-600 font-mono bg-white px-2 py-1 rounded border border-gray-100">
                                {policy}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Copy SQL */}
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Tenant-isolated via <code className="text-primary-600">cafe_id = get_current_cafe_id()</code>
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); copySQL(table.name); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                      >
                        {copiedTable === table.name ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy SQL
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ER Diagram Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary-500" />
            Entity Relationships
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { from: 'cafes', to: 'users', type: '1:N', label: 'owner → staff/customers' },
              { from: 'cafes', to: 'tables', type: '1:N', label: 'cafe has tables' },
              { from: 'cafes', to: 'menu_items', type: '1:N', label: 'cafe has menu' },
              { from: 'cafes', to: 'orders', type: '1:N', label: 'cafe has orders' },
              { from: 'orders', to: 'payments', type: '1:N', label: 'order has payments' },
              { from: 'orders', to: 'feedback', type: '1:1', label: 'order has feedback' },
              { from: 'users', to: 'orders', type: '1:N', label: 'customer places orders' },
              { from: 'users', to: 'loyalty_points', type: '1:1', label: 'per cafe loyalty' },
              { from: 'cafes', to: 'broadcasts', type: '1:N', label: 'cafe sends broadcasts' },
              { from: 'cafes', to: 'settings', type: '1:N', label: 'cafe configuration' },
              { from: 'cafes', to: 'activity_log', type: '1:N', label: 'audit trail' },
              { from: 'auth.users', to: 'cafes', type: '1:N', label: 'auth → cafe owner' },
            ].map((rel, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xs font-mono font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                  {rel.from}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">{rel.type}</span>
                <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                  {rel.to}
                </span>
                <span className="text-[10px] text-gray-400 ml-auto hidden xl:block">{rel.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tenant Isolation Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 bg-gradient-to-br from-primary-50 to-amber-50 rounded-xl border border-primary-100 p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Tenant Isolation Strategy
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              All tenant-scoped tables use <code className="px-1.5 py-0.5 bg-white rounded border border-primary-200 text-primary-700 text-xs font-mono">cafe_id</code> as 
              the tenant discriminator column.
            </p>
            <p>
              RLS policies enforce isolation using <code className="px-1.5 py-0.5 bg-white rounded border border-primary-200 text-primary-700 text-xs font-mono">get_current_cafe_id()</code> which 
              reads from <code className="px-1.5 py-0.5 bg-white rounded border border-primary-200 text-primary-700 text-xs font-mono">current_setting('app.current_cafe_id')</code>.
            </p>
            <p>
              Role-based access is enforced via helper functions: <code className="text-xs font-mono text-primary-700">is_cafe_owner()</code>, 
              <code className="text-xs font-mono text-primary-700">is_cafe_staff()</code>, and <code className="text-xs font-mono text-primary-700">is_cafe_customer()</code>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
