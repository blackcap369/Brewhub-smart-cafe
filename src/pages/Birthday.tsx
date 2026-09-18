import { Calendar, Gift } from 'lucide-react';
import BirthdayDashboard from '../components/admin/BirthdayDashboard';

interface BirthdayPageProps {
  cafeId: string;
}

export default function BirthdayPage({ cafeId }: BirthdayPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Birthday Marketing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automate birthday celebrations and offers
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
          <Gift className="w-5 h-5 text-pink-500" />
          <span className="text-sm font-medium text-pink-900 dark:text-pink-100">
            Automation Active
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">Auto-Detect</p>
          <p className="text-sm opacity-90 mt-1">Find birthdays automatically</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Gift className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">Send Wishes</p>
          <p className="text-sm opacity-90 mt-1">Personalized birthday offers</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">Track</p>
          <p className="text-sm opacity-90 mt-1">Monitor redemption rates</p>
        </div>
      </div>

      {/* Birthday Dashboard */}
      <BirthdayDashboard cafeId={cafeId} />
    </div>
  );
}
