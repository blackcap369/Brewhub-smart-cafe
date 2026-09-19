import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Send, Clock, CheckCircle, XCircle, RefreshCw, Trash2, Eye } from 'lucide-react';
import { 
  getBroadcasts, 
  deleteBroadcast, 
  resendBroadcast,
  getAudienceLabel,
  getStatusColor,
  type Broadcast,
  type BroadcastStatus
} from '../../services/broadcastService';
import { format } from 'date-fns';
import { useToast } from '../../contexts/ToastContext';

interface BroadcastHistoryProps {
  cafeId: string;
}

export default function BroadcastHistory({ cafeId }: BroadcastHistoryProps) {
  const toast = useToast();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BroadcastStatus | 'all'>('all');

  useEffect(() => {
    loadBroadcasts();
  }, [cafeId, filter]);

  const loadBroadcasts = async () => {
    setLoading(true);
    const result = await getBroadcasts(cafeId, filter === 'all' ? undefined : filter);
    if (result.success && result.broadcasts) {
      setBroadcasts(result.broadcasts);
    }
    setLoading(false);
  };

  const handleDelete = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) return;

    const result = await deleteBroadcast(broadcastId);
    if (result.success) {
      toast.success('Broadcast deleted');
      loadBroadcasts();
    } else {
      toast.error(result.error || 'Failed to delete broadcast');
    }
  };

  const handleResend = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to resend this broadcast?')) return;

    const result = await resendBroadcast(broadcastId);
    if (result.success) {
      toast.success('Broadcast resent successfully');
      loadBroadcasts();
    } else {
      toast.error(result.error || 'Failed to resend broadcast');
    }
  };

  const getStatusIcon = (status: BroadcastStatus) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'sending':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const filterOptions: { value: BroadcastStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'sent', label: 'Sent' },
    { value: 'failed', label: 'Failed' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <div className="text-center py-12">
        <Send className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No broadcasts yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create your first broadcast to engage with your customers
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Broadcasts List */}
      <div className="space-y-4">
        {broadcasts.map((broadcast) => (
          <motion.div
            key={broadcast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {broadcast.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(broadcast.status)}`}>
                    {getStatusIcon(broadcast.status)}
                    {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {broadcast.message}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(broadcast.created_at), 'MMM d, yyyy')}
                  </span>
                  <span>•</span>
                  <span>{getAudienceLabel(broadcast.audience)}</span>
                  <span>•</span>
                  <span>{broadcast.audience_count} recipients</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            {broadcast.status === 'sent' && (
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {broadcast.sent_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Delivered</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {broadcast.delivered_count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {broadcast.sent_count > 0 
                      ? ((broadcast.delivered_count / broadcast.sent_count) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Opened</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {broadcast.opened_count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {broadcast.delivered_count > 0
                      ? ((broadcast.opened_count / broadcast.delivered_count) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            )}

            {/* Scheduled Time */}
            {broadcast.status === 'scheduled' && broadcast.scheduled_at && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
                  <Clock className="w-4 h-4" />
                  <span>
                    Scheduled for {format(new Date(broadcast.scheduled_at), 'MMM d, yyyy "at" h:mm a')}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              {(broadcast.status === 'sent' || broadcast.status === 'failed') && (
                <button
                  onClick={() => handleResend(broadcast.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend
                </button>
              )}
              <button
                onClick={() => handleDelete(broadcast.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
