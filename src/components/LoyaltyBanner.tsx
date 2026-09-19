import { motion } from 'framer-motion';
import { Gift, X } from 'lucide-react';
import { useLoyaltyStore } from '../stores/loyaltyStore';

interface LoyaltyBannerProps {
  cafeId: string;
  onDismiss?: () => void;
}

export default function LoyaltyBanner({ cafeId, onDismiss }: LoyaltyBannerProps) {
  const { getLoyaltyStatus, getOrdersUntilReward, isEligibleForReward } = useLoyaltyStore();

  const status = getLoyaltyStatus(cafeId);
  
  if (!status) return null;

  const ordersUntilReward = getOrdersUntilReward(cafeId);
  const isEligible = isEligibleForReward(cafeId);

  // Don't show if already eligible (they'll see the redeem button on the card)
  if (isEligible) return null;

  // Only show if they're close to a reward (1-2 orders away)
  if (ordersUntilReward > 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg p-4 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
      </div>

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -10, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="flex-shrink-0"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
          </motion.div>

          <div className="flex-1">
            <h3 className="font-bold text-lg">
              {ordersUntilReward === 1 ? 'Almost there!' : 'So close!'}
            </h3>
            <p className="text-sm text-primary-100">
              {ordersUntilReward === 1 ? (
                <>
                  Just <span className="font-bold text-white">1 more order</span> and you'll earn a free item!
                </>
              ) : (
                <>
                  Only <span className="font-bold text-white">{ordersUntilReward} more orders</span> until your free item!
                </>
              )}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((7 - ordersUntilReward) / 7) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-white"
        />
      </div>
    </motion.div>
  );
}
