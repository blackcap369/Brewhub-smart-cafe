import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gift, Users, TrendingUp, Send, Settings, Cake } from 'lucide-react';
import {
  getUpcomingBirthdays,
  checkTodayBirthdays,
  sendBirthdayWish,
  getBirthdayOfferConfig,
  updateBirthdayOfferConfig,
  getBirthdayStats,
  formatBirthday,
  getDaysUntilBirthday,
  type BirthdayCustomer,
  type BirthdayOffer,
} from '../../services/birthdayService';
import { useToast } from '../../contexts/ToastContext';

interface BirthdayDashboardProps {
  cafeId: string;
}

export default function BirthdayDashboard({ cafeId }: BirthdayDashboardProps) {
  const toast = useToast();
  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayCustomer[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayCustomer[]>([]);
  const [offerConfig, setOfferConfig] = useState<BirthdayOffer>({
    type: 'free_item',
    item_name: 'Free Dessert',
    valid_hours: 24,
  });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoSendEnabled, setAutoSendEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, [cafeId]);

  const loadData = async () => {
    setLoading(true);
    
    const [todayResult, upcomingResult, offerResult, statsResult] = await Promise.all([
      checkTodayBirthdays(cafeId),
      getUpcomingBirthdays(cafeId),
      getBirthdayOfferConfig(cafeId),
      getBirthdayStats(cafeId),
    ]);

    if (todayResult.success && todayResult.customers) {
      setTodayBirthdays(todayResult.customers);
    }
    if (upcomingResult.success && upcomingResult.customers) {
      setUpcomingBirthdays(upcomingResult.customers);
    }
    if (offerResult.success && offerResult.config) {
      setOfferConfig(offerResult.config);
    }
    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats);
    }

    setLoading(false);
  };

  const handleSendWish = async (customer: BirthdayCustomer) => {
    const result = await sendBirthdayWish(customer.id, cafeId, offerConfig);
    
    if (result.success) {
      toast.success(`Birthday wish sent to ${customer.name}! 🎂`);
    } else {
      toast.error(result.error || 'Failed to send birthday wish');
    }
  };

  const handleSendAllWishes = async () => {
    if (todayBirthdays.length === 0) {
      toast.info('No birthdays today');
      return;
    }

    const confirmed = confirm(`Send birthday wishes to ${todayBirthdays.length} customer(s)?`);
    if (!confirmed) return;

    let successCount = 0;
    for (const customer of todayBirthdays) {
      const result = await sendBirthdayWish(customer.id, cafeId, offerConfig);
      if (result.success) successCount++;
    }

    toast.success(`Sent ${successCount} birthday wish(es)! 🎂`);
  };

  const handleSaveOfferConfig = async () => {
    const result = await updateBirthdayOfferConfig(cafeId, offerConfig);
    
    if (result.success) {
      toast.success('Birthday offer updated!');
      setShowSettings(false);
    } else {
      toast.error(result.error || 'Failed to update offer');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Birthday Marketing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Celebrate your customers' special day
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configure Offer
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.total_customers_with_dob}</p>
            <p className="text-sm opacity-90 mt-1">Customers with DOB</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.birthdays_this_month}</p>
            <p className="text-sm opacity-90 mt-1">Birthdays This Month</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Gift className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.birthdays_this_week}</p>
            <p className="text-sm opacity-90 mt-1">Birthdays This Week</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.redemptions_this_year}</p>
            <p className="text-sm opacity-90 mt-1">Redemptions This Year</p>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Birthday Offer Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Offer Type
              </label>
              <select
                value={offerConfig.type}
                onChange={(e) => setOfferConfig({ ...offerConfig, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="free_item">Free Item</option>
                <option value="discount">Discount</option>
              </select>
            </div>

            {offerConfig.type === 'free_item' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Free Item Name
                </label>
                <input
                  type="text"
                  value={offerConfig.item_name || ''}
                  onChange={(e) => setOfferConfig({ ...offerConfig, item_name: e.target.value })}
                  placeholder="e.g., Free Dessert"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {offerConfig.type === 'discount' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  value={offerConfig.discount_percentage || ''}
                  onChange={(e) =>
                    setOfferConfig({ ...offerConfig, discount_percentage: Number(e.target.value) })
                  }
                  placeholder="e.g., 20"
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valid for (hours)
              </label>
              <input
                type="number"
                value={offerConfig.valid_hours}
                onChange={(e) => setOfferConfig({ ...offerConfig, valid_hours: Number(e.target.value) })}
                min="1"
                max="168"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Auto-send wishes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically send birthday wishes at 9 AM
                </p>
              </div>
              <button
                onClick={() => setAutoSendEnabled(!autoSendEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSendEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSendEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOfferConfig}
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Today's Birthdays */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Cake className="w-6 h-6 text-pink-500" />
            Today's Birthdays ({todayBirthdays.length})
          </h2>
          {todayBirthdays.length > 0 && (
            <button
              onClick={handleSendAllWishes}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              Send All Wishes
            </button>
          )}
        </div>

        {todayBirthdays.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No birthdays today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBirthdays.map((customer) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.phone} • {customer.total_orders} orders
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendWish(customer)}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    Send Wish
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Birthdays */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-500" />
          Upcoming Birthdays (Next 7 Days)
        </h2>

        {upcomingBirthdays.filter((c) => !todayBirthdays.find((t) => t.id === c.id)).length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No upcoming birthdays</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBirthdays
              .filter((c) => !todayBirthdays.find((t) => t.id === c.id))
              .map((customer) => {
                const daysUntil = getDaysUntilBirthday(customer.dob);
                
                return (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {customer.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatBirthday(customer.dob)} • {customer.total_orders} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {daysUntil === 0 ? 'Today!' : `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                        </p>
                        <button
                          onClick={() => handleSendWish(customer)}
                          className="mt-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Send Early Wish
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
