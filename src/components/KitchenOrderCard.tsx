import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Database } from '../types/database';

type Order = Database['public']['Tables']['orders']['Row'];

interface KitchenOrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: 'received' | 'preparing' | 'ready' | 'cancelled') => void;
}

export const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({ order, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Calculate elapsed time
  useEffect(() => {
    const updateElapsedTime = () => {
      const now = new Date().getTime();
      const orderTime = new Date(order.created_at).getTime();
      const elapsed = Math.floor((now - orderTime) / 1000); // seconds
      setElapsedTime(elapsed);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [order.created_at]);

  // Format elapsed time
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if order is taking too long (> 15 minutes)
  const isOverdue = elapsedTime > 900; // 15 minutes in seconds

  // Get status color classes
  const getStatusClasses = () => {
    switch (order.status) {
      case 'received':
        return {
          border: 'border-red-500',
          bg: 'bg-red-500/10',
          pulse: 'animate-pulse',
          text: 'text-red-600',
        };
      case 'preparing':
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-500/10',
          pulse: '',
          text: 'text-amber-600',
        };
      case 'ready':
        return {
          border: 'border-green-500',
          bg: 'bg-green-500/10',
          pulse: '',
          text: 'text-green-600',
        };
      default:
        return {
          border: 'border-gray-500',
          bg: 'bg-gray-500/10',
          pulse: '',
          text: 'text-gray-600',
        };
    }
  };

  const statusClasses = getStatusClasses();

  // Handle swipe gestures
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - move to next status
      if (order.status === 'received') {
        onStatusChange(order.id, 'preparing');
      } else if (order.status === 'preparing') {
        onStatusChange(order.id, 'ready');
      }
    } else if (isRightSwipe) {
      // Swipe right - move to previous status or cancel
      if (order.status === 'preparing') {
        onStatusChange(order.id, 'received');
      } else if (order.status === 'ready') {
        onStatusChange(order.id, 'preparing');
      }
    }
  };

  // Parse items from JSON
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative border-4 ${statusClasses.border} ${statusClasses.bg} ${statusClasses.pulse} rounded-lg p-4 shadow-lg transition-all`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-white">#{order.order_number}</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${statusClasses.bg} ${statusClasses.text}`}>
              {order.status}
            </span>
          </div>
          <div className="text-lg font-semibold text-white">
            Table {order.table_no}
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm font-mono ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
          <Clock className="w-4 h-4" />
          <span>{formatElapsedTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-3">
        {items.map((item: any, index: number) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-lg font-bold text-white min-w-[2rem]">
              {item.quantity}x
            </span>
            <div className="flex-1">
              <div className="text-white font-medium">{item.name}</div>
              {item.notes && (
                <div className="text-sm text-yellow-300 mt-1 italic">
                  ⚠️ {item.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Special Instructions */}
      {order.notes && (
        <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">{order.notes}</div>
          </div>
        </div>
      )}

      {/* Expandable Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3 p-2 bg-gray-800/50 rounded text-sm text-gray-300"
        >
          <div className="space-y-1">
            <div>Order Type: {order.order_type}</div>
            <div>Created: {new Date(order.created_at).toLocaleString()}</div>
            {order.customer_id && <div>Customer ID: {order.customer_id}</div>}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {order.status === 'received' && (
          <button
            onClick={() => onStatusChange(order.id, 'preparing')}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Start Preparing
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={() => onStatusChange(order.id, 'ready')}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Mark Ready
          </button>
        )}
        {order.status === 'ready' && (
          <button
            onClick={() => onStatusChange(order.id, 'received')}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Reset
          </button>
        )}
        <button
          onClick={() => onStatusChange(order.id, 'cancelled')}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Expand Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
      >
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Overdue Indicator */}
      {isOverdue && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          OVERDUE
        </div>
      )}
    </motion.div>
  );
};
