import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  AlertCircle,
  Timer,
  Flame,
  Coffee,
  UtensilsCrossed,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  items: { name: string; quantity: number; status: string; notes?: string }[];
  orderType: string;
  tableNumber?: number;
  createdAt: Date;
  priority: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'preparing' | 'ready';
}

const mockKitchenOrders: KitchenOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    items: [
      { name: 'Espresso', quantity: 2, status: 'preparing' },
      { name: 'Cappuccino', quantity: 1, status: 'pending' },
      { name: 'Croissant', quantity: 1, status: 'ready' },
    ],
    orderType: 'dine-in',
    tableNumber: 3,
    createdAt: new Date(Date.now() - 8 * 60000),
    priority: 'high',
    status: 'preparing',
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    items: [
      { name: 'Avocado Toast', quantity: 1, status: 'pending', notes: 'No onions' },
      { name: 'Matcha Latte', quantity: 1, status: 'pending' },
    ],
    orderType: 'takeaway',
    createdAt: new Date(Date.now() - 3 * 60000),
    priority: 'normal',
    status: 'pending',
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    items: [
      { name: 'Iced Americano', quantity: 3, status: 'preparing' },
    ],
    orderType: 'dine-in',
    tableNumber: 7,
    createdAt: new Date(Date.now() - 12 * 60000),
    priority: 'urgent',
    status: 'preparing',
  },
  {
    id: '4',
    orderNumber: 'ORD-004',
    items: [
      { name: 'Cappuccino', quantity: 2, status: 'ready' },
      { name: 'Croissant', quantity: 2, status: 'ready' },
    ],
    orderType: 'dine-in',
    tableNumber: 1,
    createdAt: new Date(Date.now() - 15 * 60000),
    priority: 'normal',
    status: 'ready',
  },
];

const priorityConfig = {
  normal: { color: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', icon: Clock },
  high: { color: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', icon: Flame },
  urgent: { color: 'border-red-300', badge: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  preparing: { color: 'bg-purple-100 text-purple-700', label: 'Preparing' },
  ready: { color: 'bg-emerald-100 text-emerald-700', label: 'Ready' },
};

export default function Kitchen() {
  const [orders, setOrders] = useState(mockKitchenOrders);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');

  const filteredOrders = orders.filter((order) =>
    filter === 'all' ? true : order.status === filter
  );

  const updateItemStatus = (orderId: string, itemName: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items.map((item) => {
          if (item.name !== itemName) return item;
          const nextStatus = item.status === 'pending' ? 'preparing' : 'ready';
          return { ...item, status: nextStatus };
        });
        const allReady = updatedItems.every((i) => i.status === 'ready');
        return {
          ...order,
          items: updatedItems,
          status: allReady ? 'ready' : updatedItems.some((i) => i.status !== 'pending') ? 'preparing' : 'pending',
        };
      })
    );
  };

  const markOrderReady = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'ready' as const,
              items: order.items.map((i) => ({ ...i, status: 'ready' })),
            }
          : order
      )
    );
  };

  const completeOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Kitchen Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Kitchen Display</h1>
                <p className="text-xs text-gray-400">Real-time order management</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-gray-700/50 rounded-xl p-1">
              {(['all', 'pending', 'preparing', 'ready'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === tab
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => {
              const config = priorityConfig[order.priority];
              const PriorityIcon = config.icon;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white rounded-xl border-2 ${config.color} overflow-hidden shadow-lg`}
                >
                  {/* Order Header */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        #{order.orderNumber}
                      </span>
                      {order.tableNumber && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                          T{order.tableNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${config.badge}`}>
                        <PriorityIcon className="w-3 h-3" />
                        {order.priority}
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="px-4 py-2 flex items-center justify-between bg-gray-50/50 border-b border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Timer className="w-3.5 h-3.5" />
                      {formatDistanceToNow(order.createdAt, { addSuffix: false })}
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${statusConfig[order.status].color}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          item.status === 'ready' ? 'bg-emerald-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 w-5">
                            {item.quantity}x
                          </span>
                          <span className={`text-sm font-medium ${
                            item.status === 'ready' ? 'text-emerald-700 line-through' : 'text-gray-900'
                          }`}>
                            {item.name}
                          </span>
                        </div>
                        <button
                          onClick={() => updateItemStatus(order.id, item.name)}
                          disabled={item.status === 'ready'}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            item.status === 'ready'
                              ? 'bg-emerald-200 text-emerald-600 cursor-default'
                              : 'bg-primary-100 hover:bg-primary-200 text-primary-700'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {order.items.some((i) => i.notes) && (
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-700 font-medium">
                          📝 {order.items.find((i) => i.notes)?.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                    {order.status !== 'ready' ? (
                      <button
                        onClick={() => markOrderReady(order.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Mark Ready
                      </button>
                    ) : (
                      <button
                        onClick={() => completeOrder(order.id)}
                        className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Complete Order
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">No orders in queue</p>
            <p className="text-sm text-gray-500 mt-1">New orders will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
