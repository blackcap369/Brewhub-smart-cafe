import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  ChefHat,
  CheckCircle,
  Coffee,
  Phone,
  ArrowLeft,
  MapPin,
  Timer,
} from 'lucide-react';
import { getOrder, subscribeToOrderStatus } from '../services/orderService';
import type { OrderWithItems } from '../services/orderService';

type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';

const statusSteps = [
  { status: 'received', label: 'Order Received', icon: Clock, description: 'Your order has been received' },
  { status: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Chef is preparing your food' },
  { status: 'ready', label: 'Ready', icon: CheckCircle, description: 'Your order is ready' },
  { status: 'served', label: 'Served', icon: Coffee, description: 'Enjoy your meal!' },
];

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial order data
    const fetchOrder = async () => {
      try {
        const result = await getOrder(orderId);
        if (result.success && result.order) {
          setOrder(result.order);
        } else {
          setError(result.error || 'Failed to fetch order');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToOrderStatus(orderId, (newStatus) => {
      setOrder((prev) => (prev ? { ...prev, status: newStatus as OrderStatus } : null));
    });

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex((step) => step.status === order.status);
  };

  const getEstimatedTime = () => {
    if (!order) return 0;
    // Calculate remaining time based on status
    const currentStep = getCurrentStepIndex();
    const totalSteps = statusSteps.length;
    const remainingSteps = totalSteps - currentStep;
    return remainingSteps * 5; // 5 minutes per step
  };

  const handleCallKitchen = () => {
    // In a real app, this would trigger a notification to the kitchen
    alert('Kitchen has been notified!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const estimatedTime = getEstimatedTime();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-sm text-gray-600">Order #{order.order_number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-100 text-sm">Current Status</p>
              <h2 className="text-2xl font-bold">
                {statusSteps[currentStepIndex]?.label || 'Processing'}
              </h2>
            </div>
            {estimatedTime > 0 && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <Timer className="w-5 h-5" />
                <span className="font-semibold">{estimatedTime} min</span>
              </div>
            )}
          </div>
          <p className="text-primary-100">
            {statusSteps[currentStepIndex]?.description}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Order Progress</h3>
          <div className="space-y-0">
            {statusSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.status} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500'
                          : isCurrent
                          ? 'bg-primary-600 ring-4 ring-primary-100'
                          : 'bg-gray-200'
                      }`}
                    >
                      <step.icon
                        className={`w-6 h-6 ${
                          isPending ? 'text-gray-400' : 'text-white'
                        }`}
                      />
                    </motion.div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-16 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <h4
                      className={`font-semibold ${
                        isPending ? 'text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p
                      className={`text-sm ${
                        isPending ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {step.description}
                    </p>
                    {isCurrent && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-primary-600 font-medium mt-2 flex items-center gap-1"
                      >
                        <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
                        In progress...
                      </motion.p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>

          {/* Table Info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 mb-4">
            <MapPin className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Table Number</p>
              <p className="font-semibold text-gray-900">{order.table_no}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            {(order.items as any[]).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                    {item.quantity}x
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 italic">Note: {item.notes}</p>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (5% GST)</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Call Kitchen Button */}
        {order.status !== 'served' && order.status !== 'cancelled' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleCallKitchen}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg"
          >
            <Phone className="w-5 h-5" />
            Call Kitchen
          </motion.button>
        )}
      </div>
    </div>
  );
}
