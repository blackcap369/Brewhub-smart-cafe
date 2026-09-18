import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Package,
  Coffee,
  MapPin,
  Timer,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '../utils';
import ErrorBoundary from '../components/ui/ErrorBoundary';

const orderSteps = [
  { id: 1, label: 'Order Placed', icon: CheckCircle2, description: 'Your order has been received' },
  { id: 2, label: 'Confirmed', icon: Clock, description: 'Restaurant confirmed your order' },
  { id: 3, label: 'Preparing', icon: ChefHat, description: 'Chef is preparing your food' },
  { id: 4, label: 'Ready', icon: Package, description: 'Your order is ready for pickup' },
  { id: 5, label: 'Completed', icon: Coffee, description: 'Order delivered successfully' },
];

const mockOrder = {
  id: '1',
  orderNumber: 'ORD-001',
  status: 'preparing',
  currentStep: 3,
  estimatedTime: '10-15 min',
  items: [
    { name: 'Espresso', quantity: 2, price: 3.5 },
    { name: 'Cappuccino', quantity: 1, price: 4.5 },
    { name: 'Croissant', quantity: 1, price: 3.0 },
  ],
  total: 14.5,
  orderType: 'dine-in',
  tableNumber: 3,
  placedAt: new Date(Date.now() - 8 * 60000).toISOString(),
};

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const order = mockOrder; // In real app, fetch by id

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Order Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {order.orderType === 'dine-in' ? `Table ${order.tableNumber}` : order.orderType}
                </p>
              </div>
              <div className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Timer className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Estimated time</p>
                <p className="text-xs text-amber-600">{order.estimatedTime} remaining</p>
              </div>
            </div>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm"
          >
            <h2 className="font-semibold text-gray-900 mb-6">Order Progress</h2>
            <div className="space-y-0">
              {orderSteps.map((step, idx) => {
                const isCompleted = step.id < order.currentStep;
                const isCurrent = step.id === order.currentStep;
                const isPending = step.id > order.currentStep;

                return (
                  <div key={step.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 + 0.3 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : isCurrent
                            ? 'bg-primary-500 ring-4 ring-primary-100'
                            : 'bg-gray-200'
                        }`}
                      >
                        <step.icon className={`w-5 h-5 ${
                          isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                        }`} />
                      </motion.div>
                      {idx < orderSteps.length - 1 && (
                        <div className={`w-0.5 h-12 ${
                          isCompleted ? 'bg-emerald-300' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-8">
                      <p className={`font-medium ${
                        isPending ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {step.label}
                      </p>
                      <p className={`text-sm ${
                        isPending ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                      {isCurrent && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-primary-600 font-medium mt-1 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
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
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
          >
            <h2 className="font-semibold text-gray-900 mb-4">Order Details</h2>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center text-xs font-bold text-gray-600">
                      {item.quantity}
                    </span>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(order.total)}
              </span>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <button className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" />
              Track on Map
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
