import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import {
  getFeedback,
  getFeedbackStats,
  respondToFeedback,
  deleteFeedback,
  exportFeedbackToCSV,
  getRatingEmoji,
  getRatingLabel,
  getCategoryLabel,
  type Feedback,
  type FeedbackStats,
  type FeedbackFilters,
} from '../../services/feedbackService';
import { format } from 'date-fns';
import { useToast } from '../../contexts/ToastContext';

interface FeedbackViewProps {
  cafeId: string;
}

export default function FeedbackView({ cafeId }: FeedbackViewProps) {
  const toast = useToast();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadData();
  }, [cafeId, filters]);

  const loadData = async () => {
    setLoading(true);
    const [feedbackResult, statsResult] = await Promise.all([
      getFeedback(cafeId, filters),
      getFeedbackStats(cafeId),
    ]);

    if (feedbackResult.success && feedbackResult.feedback) {
      setFeedback(feedbackResult.feedback);
    }
    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats);
    }
    setLoading(false);
  };

  const handleRespond = async (feedbackId: string) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    const result = await respondToFeedback(feedbackId, responseText, 'admin');
    if (result.success) {
      toast.success('Response sent');
      setRespondingTo(null);
      setResponseText('');
      loadData();
    } else {
      toast.error(result.error || 'Failed to send response');
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    const result = await deleteFeedback(feedbackId);
    if (result.success) {
      toast.success('Feedback deleted');
      loadData();
    } else {
      toast.error(result.error || 'Failed to delete feedback');
    }
  };

  const handleExport = () => {
    const csv = exportFeedbackToCSV(feedback);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Feedback exported');
  };

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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No feedback yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Feedback will appear here once customers start submitting reviews
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.average_rating.toFixed(1)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {stats.recent_trend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                stats.recent_trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {Math.abs(stats.recent_trend).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.total_reviews}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Response Rate</p>
            <MessageSquare className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.response_rate.toFixed(0)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">5-Star Reviews</p>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.rating_distribution[5]}
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Rating Distribution
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution];
            const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-2xl">{getRatingEmoji(rating)}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {rating}
                  </span>
                </div>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-end px-2"
                  >
                    {percentage > 10 && (
                      <span className="text-xs font-bold text-white">{count}</span>
                    )}
                  </motion.div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Feedback
          </h3>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <select
            value={filters.rating || ''}
            onChange={(e) =>
              setFilters({ ...filters, rating: e.target.value ? Number(e.target.value) : undefined })
            }
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={filters.has_response === undefined ? '' : filters.has_response ? 'yes' : 'no'}
            onChange={(e) =>
              setFilters({
                ...filters,
                has_response: e.target.value === '' ? undefined : e.target.value === 'yes',
              })
            }
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Responses</option>
            <option value="yes">Responded</option>
            <option value="no">Not Responded</option>
          </select>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No feedback found</p>
            </div>
          ) : (
            feedback.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getRatingEmoji(item.rating)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= item.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-300 text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {getRatingLabel(item.rating)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!item.response && (
                      <button
                        onClick={() => setRespondingTo(item.id)}
                        className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Respond
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {item.categories && item.categories.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {item.categories.map((category) => (
                      <span
                        key={category}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                      >
                        {getCategoryLabel(category)}
                      </span>
                    ))}
                  </div>
                )}

                {item.comment && (
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{item.comment}</p>
                )}

                {item.response && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                      Owner Response
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">{item.response}</p>
                    {item.responded_at && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {format(new Date(item.responded_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                )}

                {respondingTo === item.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3"
                  >
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleRespond(item.id)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Send Response
                      </button>
                      <button
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText('');
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
