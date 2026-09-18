import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
} from 'lucide-react';
import { useDashboardStats } from '../hooks';
import { formatCurrency } from '../utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import Sidebar from '../components/layout/Sidebar';

const recentOrders = [
  { id: '1', number: 'ORD-001', customer: 'Table 3', total: 24.5, status: 'preparing', time: '5 min ago', type: 'dine-in' },
  { id: '2', number: 'ORD-002', customer: 'Walk-in', total: 8.0, status: 'pending', time: '2 min ago', type: 'takeaway' },
  { id: '3', number: 'ORD-003', customer: 'Table 7', total: 36.0, status: 'ready', time: '12 min ago', type: 'dine-in' },
  { id: '4', number: 'ORD-004', customer: 'Table 1', total: 15.5, status: 'completed', time: '20 min ago', type: 'dine-in' },
  { id: '5', number: 'ORD-005', customer: 'Delivery', total: 42.0, status: 'preparing', time: '8 min ago', type: 'delivery' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const statCards = [
  {
    title: 'Today\'s Revenue',
    icon: DollarSign,
    color: 'from-emerald-400 to-emerald-600',
    bgColor: 'bg-emerald-50',
    change: '+12.5%',
    isUp: true,
  },
  {
    title: 'Total Orders',
    icon: ShoppingBag,
    color: 'from-primary-400 to-primary-600',
    bgColor: 'bg-primary-50',
    change: '+8.2%',
    isUp: true,
  },
  {
    title: 'Avg. Order Value',
    icon: TrendingUp,
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-50',
    change: '-2.1%',
    isUp: false,
  },
  {
    title: 'Active Customers',
    icon: Users,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    change: '+15.3%',
    isUp: true,
  },
];

export default function Admin() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Export Report
                </button>
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                  New Order
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            {isLoading ? (
              <LoadingSpinner text="Loading dashboard..." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, idx) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${
                        card.isUp ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {card.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {card.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.title === 'Today\'s Revenue'
                        ? formatCurrency(stats?.todayRevenue || 0)
                        : card.title === 'Total Orders'
                        ? stats?.todayOrders || 0
                        : card.title === 'Avg. Order Value'
                        ? formatCurrency(stats?.averageOrderValue || 0)
                        : stats?.activeOrders || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{card.title}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          order.type === 'dine-in' ? 'bg-blue-100' : order.type === 'takeaway' ? 'bg-amber-100' : 'bg-purple-100'
                        }`}>
                          {order.type === 'dine-in' ? (
                            <Coffee className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ShoppingBag className={`w-4 h-4 ${order.type === 'takeaway' ? 'text-amber-600' : 'text-purple-600'}`} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.number}</p>
                          <p className="text-xs text-gray-500">{order.customer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${statusColors[order.status]}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                          {formatCurrency(order.total)}
                        </span>
                        <span className="text-xs text-gray-400 w-16 text-right">
                          {order.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats Panel */}
              <div className="space-y-4">
                {/* Order Status Summary */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Pending', count: 3, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
                      { label: 'Preparing', count: 5, icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-100' },
                      { label: 'Ready', count: 2, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100' },
                      { label: 'Completed', count: 32, icon: CheckCircle2, color: 'text-gray-500', bg: 'bg-gray-100' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 ${item.bg} rounded-lg flex items-center justify-center`}>
                            <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                          </div>
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Items */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Items Today</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Cappuccino', orders: 24, percentage: 85 },
                      { name: 'Avocado Toast', orders: 18, percentage: 65 },
                      { name: 'Espresso', orders: 15, percentage: 55 },
                      { name: 'Matcha Latte', orders: 12, percentage: 42 },
                    ].map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{item.name}</span>
                          <span className="text-xs text-gray-500">{item.orders} orders</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
