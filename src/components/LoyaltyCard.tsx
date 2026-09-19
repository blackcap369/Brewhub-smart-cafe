import { motion } from 'framer-motion';
import { Award, Gift, Clock } from 'lucide-react';
import { useLoyaltyStore } from '../stores/loyaltyStore';

interface LoyaltyCardProps {
  cafeId: string;
  onRedeem?: () => void;
}

const tierConfig = {
  bronze: {
    label: 'Bronze',
    color: 'from-amber-600 to-amber-800',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-900',
    icon: '🥉',
  },
  silver: {
    label: 'Silver',
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-900',
    icon: '🥈',
  },
  gold: {
    label: 'Gold',
    color: 'from-yellow-400 to-yellow-600',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-900',
    icon: '🥇',
  },
  platinum: {
    label: 'Platinum',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900',
    icon: '💎',
  },
};

export default function LoyaltyCard({ cafeId, onRedeem }: LoyaltyCardProps) {
  const {
    getLoyaltyStatus,
    isEligibleForReward,
    getOrdersUntilReward,
    isInCooldown,
    getCooldownRemaining,
  } = useLoyaltyStore();

  const status = getLoyaltyStatus(cafeId);
  
  if (!status) return null;

  const ordersUntilReward = getOrdersUntilReward(cafeId);
  const isEligible = isEligibleForReward(cafeId);
  const inCooldown = isInCooldown(cafeId);
  const cooldownRemaining = getCooldownRemaining(cafeId);
  const tier = tierConfig[status.tier];
  const progress = (status.ordersCount % 7) / 7;

  const formatCooldown = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className={`bg-gradient-to-r ${tier.color} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{tier.icon}</div>
            <div>
              <h3 className="font-bold text-lg">{tier.label} Member</h3>
              <p className="text-sm opacity-90">{status.points} points earned</p>
            </div>
          </div>
          <Award className="w-8 h-8 opacity-50" />
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-4">
        {/* Stamp Card Visual */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Order {status.ordersCount % 7 === 0 && status.ordersCount > 0 ? 7 : status.ordersCount % 7} of 7
            </span>
            {ordersUntilReward > 0 && (
              <span className="text-sm text-gray-500">
                {ordersUntilReward} more for a free item!
              </span>
            )}
          </div>

          {/* Stamp Circles */}
          <div className="flex items-center justify-between gap-1">
            {Array.from({ length: 7 }).map((_, index) => {
              const isFilled = index < (status.ordersCount % 7);
              const isCurrent = index === (status.ordersCount % 7);
              
              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex-1 aspect-square rounded-full border-2 flex items-center justify-center ${
                    isFilled
                      ? 'bg-primary-500 border-primary-600'
                      : isCurrent
                      ? 'border-primary-400 bg-primary-50 animate-pulse'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {isFilled && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                  {isCurrent && !isFilled && (
                    <span className="text-xs text-primary-600 font-bold">
                      {(status.ordersCount % 7) + 1}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${tier.color}`}
            />
          </div>
        </div>

        {/* Action Section */}
        <div className="pt-3 border-t border-gray-200">
          {isEligible ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRedeem}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              Redeem Free Item
            </motion.button>
          ) : inCooldown ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-600 rounded-xl">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">
                Next reward in {formatCooldown(cooldownRemaining)}
              </span>
            </div>
          ) : ordersUntilReward > 0 ? (
            <div className="text-center py-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-primary-600">{ordersUntilReward}</span>{' '}
                {ordersUntilReward === 1 ? 'order' : 'orders'} until your free item!
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
