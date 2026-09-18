import { useState } from 'react';
import { Plus, Send } from 'lucide-react';
import BroadcastComposer from '../components/admin/BroadcastComposer';
import BroadcastHistory from '../components/admin/BroadcastHistory';
import { useAuth } from '../hooks/useAuth';

interface BroadcastsProps {
  cafeId: string;
}

export default function Broadcasts({ cafeId }: BroadcastsProps) {
  const { user } = useAuth();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Broadcasts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Send messages and promotions to your customers
          </p>
        </div>
        <button
          onClick={() => setIsComposerOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Broadcast
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Send className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">Broadcast</p>
          <p className="text-sm opacity-90 mt-1">Reach customers instantly</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">Segment</p>
          <p className="text-sm opacity-90 mt-1">Target specific audiences</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-3xl font-bold">Schedule</p>
          <p className="text-sm opacity-90 mt-1">Plan ahead with scheduling</p>
        </div>
      </div>

      {/* Broadcast History */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Broadcast History
        </h2>
        <BroadcastHistory cafeId={cafeId} />
      </div>

      {/* Broadcast Composer Modal */}
      <BroadcastComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        cafeId={cafeId}
        userId={user?.id || ''}
        onSuccess={() => {
          // Refresh the history
          window.location.reload();
        }}
      />
    </div>
  );
}
