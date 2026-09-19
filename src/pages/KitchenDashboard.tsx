import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { KitchenOrderCard } from '../components/KitchenOrderCard';
import { soundService } from '../utils/soundService';
import { supabase } from '../services/supabase';
import { getCountdown } from '../services/preOrderService';
import type { Database } from '../types/database';

type Order = Database['public']['Tables']['orders']['Row'];

type StatusFilter = 'all' | 'received' | 'preparing' | 'ready';

export const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [preOrders, setPreOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Fetch regular orders
        const { data: regularOrders, error: regularError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_type', 'dine_in')
          .in('status', ['received', 'preparing', 'ready'])
          .order('created_at', { ascending: true });

        if (regularError) throw regularError;

        // Fetch pre-orders
        const { data: preOrderData, error: preOrderError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_type', 'pre_order')
          .in('pre_order_status', ['scheduled', 'confirmed', 'preparing', 'ready'])
          .order('scheduled_time', { ascending: true });

        if (preOrderError) throw preOrderError;

        setOrders(regularOrders || []);
        setPreOrders(preOrderData || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    // Fallback polling every 2 seconds
    const interval = setInterval(fetchOrders, 2000);

    return () => clearInterval(interval);
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('Real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            
            // Only add if it's in active status
            if (['received', 'preparing', 'ready'].includes(newOrder.status)) {
              setOrders((prev) => {
                // Check if order already exists
                const exists = prev.some((o) => o.id === newOrder.id);
                if (exists) {
                  return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
                }
                // Play sound for new order
                if (!isMuted) {
                  soundService.playNewOrder();
                }
                return [...prev, newOrder].sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order;
            setOrders((prev) => {
              // If status changed to served or cancelled, remove from list
              if (['served', 'cancelled'].includes(updatedOrder.status)) {
                return prev.filter((o) => o.id !== updatedOrder.id);
              }
              // Otherwise update the order
              return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
            });

            // Play sound if order is ready
            if (updatedOrder.status === 'ready' && !isMuted) {
              soundService.playOrderReady();
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as Order;
            setOrders((prev) => prev.filter((o) => o.id !== deletedOrder.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMuted]);

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: 'received' | 'preparing' | 'ready' | 'cancelled') => {
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                updated_at: new Date().toISOString(),
                ...(newStatus === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
              }
            : o
        )
      );

      // Remove cancelled orders after a delay
      if (newStatus === 'cancelled') {
        if (!isMuted) {
          soundService.playOrderCancelled();
        }
        setTimeout(() => {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
        }, 2000);
      }

      // Update in database
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
      // Revert optimistic update on error
      // In production, you'd want to refetch or show an error message
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'cancelled').length;
    const newOrders = orders.filter((o) => o.status === 'received').length;
    const preparingOrders = orders.filter((o) => o.status === 'preparing').length;
    const readyOrders = orders.filter((o) => o.status === 'ready').length;

    // Calculate average preparation time (for completed orders today)
    // This would need historical data, so we'll skip for now
    const avgPrepTime = 0;

    return {
      activeOrders,
      newOrders,
      preparingOrders,
      readyOrders,
      avgPrepTime,
    };
  }, [orders]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundService.setMuted(newMuted);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold">Kitchen Display System</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              Active Orders
            </div>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
          </div>
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              New Orders
            </div>
            <div className="text-2xl font-bold">{stats.newOrders}</div>
          </div>
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
              <ChefHat className="w-4 h-4" />
              Preparing
            </div>
            <div className="text-2xl font-bold">{stats.preparingOrders}</div>
          </div>
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Ready
            </div>
            <div className="text-2xl font-bold">{stats.readyOrders}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'received', 'preparing', 'ready'] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === filter
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter === 'all' && 'All'}
              {filter === 'received' && 'New'}
              {filter === 'preparing' && 'Preparing'}
              {filter === 'ready' && 'Ready'}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-Orders Section */}
      {preOrders.length > 0 && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Upcoming Pre-Orders</h2>
            <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
              {preOrders.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {preOrders.map((order) => {
                const countdown = getCountdown(order.scheduled_time || '');
                const isUpcoming = countdown.totalMinutes > 0 && countdown.totalMinutes <= 30;
                
                return (
                  <motion.div
                    key={order.id}
                    layout
                    className={`relative border-2 rounded-lg p-4 shadow-lg ${
                      isUpcoming
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    {/* Pre-order Badge */}
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      PRE-ORDER
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold">#{order.order_number}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                            order.pre_order_status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                            order.pre_order_status === 'confirmed' ? 'bg-purple-500/20 text-purple-400' :
                            order.pre_order_status === 'preparing' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {order.pre_order_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Time */}
                    <div className="mb-3 p-2 bg-gray-900/50 rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">
                          {order.scheduled_time && format(new Date(order.scheduled_time), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {!countdown.isPast && (
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className={`font-mono ${isUpcoming ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                            {countdown.hours > 0 ? `${countdown.hours}h ` : ''}
                            {countdown.minutes}m {countdown.seconds}s
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 mb-3">
                      {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item: any, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-lg font-bold min-w-[2rem]">
                            {item.quantity}x
                          </span>
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            {item.notes && (
                              <div className="text-sm text-yellow-300 mt-1 italic">
                                ⚠️ {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.pre_order_status === 'scheduled' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.pre_order_status === 'preparing' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'ready')}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                        >
                          Mark Ready
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Regular Orders Grid */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold">Current Orders</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <div className="text-xl text-gray-400">No orders in queue</div>
              <div className="text-sm text-gray-500 mt-2">
                New orders will appear here automatically
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
