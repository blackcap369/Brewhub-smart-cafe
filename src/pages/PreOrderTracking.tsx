import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Edit2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getPreOrders, cancelPreOrder, canCancelPreOrder, getCountdown } from '../services/preOrderService';
import type { PreOrder } from '../services/preOrderService';
import { useToast } from '../contexts/ToastContext';

interface PreOrderTrackingProps {
  customerId: string;
}

export default function PreOrderTracking({ customerId }: PreOrderTrackingProps) {
  const [orders, setOrders] = useState<PreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PreOrder | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadOrders();
  }, [customerId]);

  const loadOrders = async () => {
    setLoading(true);
    const result = await getPreOrders(customerId);
    if (result.success && result.orders) {
      setOrders(result.orders);
    }
    setLoading(false);
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this pre-order?')) return;

    const result = await cancelPreOrder(orderId, 'Cancelled by customer');
    if (result.success) {
      toast.success('Pre-order cancelled successfully');
      loadOrders();
      setSelectedOrder(null);
    } else {
      toast.error(result.error || 'Failed to cancel pre-order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'preparing':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ready':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'picked_up':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'preparing':
        return <Clock className="w-4 h-4" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'picked_up':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading pre-orders...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pre-Orders</h3>
        <p className="text-gray-600">You don't have any scheduled pre-orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Pre-Orders</h2>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const countdown = getCountdown(order.scheduled_time);
          const canCancel = canCancelPreOrder(order.scheduled_time);

          return (
            <motion.div
              key={order.id}
              layout
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getStatusColor(order.pre_order_status)}`}>
                    {getStatusIcon(order.pre_order_status)}
                    <span className="capitalize">{order.pre_order_status.replace('_', ' ')}</span>
                  </div>
                  <span className="text-sm text-gray-500">#{order.order_number}</span>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View Details
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(order.scheduled_time), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {format(new Date(order.scheduled_time), 'h:mm a')}
                  </span>
                  {!countdown.isPast && order.pre_order_status !== 'cancelled' && (
                    <span className="text-xs text-primary-600 ml-2">
                      in {countdown.hours > 0 ? `${countdown.hours}h ` : ''}{countdown.minutes}m
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {canCancel && order.pre_order_status !== 'cancelled' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleCancel(order.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(selectedOrder.pre_order_status)}`}>
                {getStatusIcon(selectedOrder.pre_order_status)}
                <span className="font-medium capitalize">
                  {selectedOrder.pre_order_status.replace('_', ' ')}
                </span>
              </div>

              {/* Scheduled Time */}
              <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scheduled for</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {format(new Date(selectedOrder.scheduled_time), 'EEEE, MMMM d, yyyy "at" h:mm a')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (5% GST)</span>
                  <span className="text-gray-900">₹{selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-primary-600">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              {canCancelPreOrder(selectedOrder.scheduled_time) && selectedOrder.pre_order_status !== 'cancelled' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCancel(selectedOrder.id)}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
