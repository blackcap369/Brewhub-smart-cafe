import { MessageSquare, Star } from 'lucide-react';
import FeedbackView from '../components/admin/FeedbackView';

interface FeedbackPageProps {
  cafeId: string;
}

export default function FeedbackPage({ cafeId }: FeedbackPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Customer Feedback
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage customer reviews and ratings
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Rating System Active
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">Collect</p>
          <p className="text-sm opacity-90 mt-1">Gather customer feedback</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">Analyze</p>
          <p className="text-sm opacity-90 mt-1">Track ratings and trends</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">Respond</p>
          <p className="text-sm opacity-90 mt-1">Engage with customers</p>
        </div>
      </div>

      {/* Feedback View */}
      <FeedbackView cafeId={cafeId} />
    </div>
  );
}
