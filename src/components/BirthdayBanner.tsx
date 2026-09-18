import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Cake } from 'lucide-react';
import { isCustomerBirthday, getBirthdayOfferConfig, type BirthdayOffer } from '../services/birthdayService';
import { useCartStore } from '../stores/cartStore';
import { useToast } from '../contexts/ToastContext';

interface BirthdayBannerProps {
  customerId: string;
  cafeId: string;
}

export default function BirthdayBanner({ customerId, cafeId }: BirthdayBannerProps) {
  const [isBirthday, setIsBirthday] = useState(false);
  const [offer, setOffer] = useState<BirthdayOffer | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const cart = useCartStore();
  const toast = useToast();

  useEffect(() => {
    checkBirthday();
  }, [customerId, cafeId]);

  const checkBirthday = async () => {
    try {
      const birthdayResult = await isCustomerBirthday(customerId);
      if (birthdayResult.success && birthdayResult.isBirthday) {
        setIsBirthday(true);
        setShowConfetti(true);
        
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
        
        // Get birthday offer
        const offerResult = await getBirthdayOfferConfig(cafeId);
        if (offerResult.success && offerResult.config) {
          setOffer(offerResult.config);
        }
      }
    } catch (error) {
      console.error('Error checking birthday:', error);
    }
  };

  const handleClaimOffer = () => {
    if (!offer) return;

    if (offer.type === 'free_item' && offer.item_name) {
      // Add free item to cart
      cart.addItem({
        menuItemId: 'birthday-free-item',
        name: `${offer.item_name} (Birthday Special 🎂)`,
        price: 0,
        isVeg: true,
        isSpicy: false,
      });
      
      toast.success('🎂 Birthday treat added to your cart!');
    } else if (offer.type === 'discount' && offer.discount_percentage) {
      toast.success(`🎂 ${offer.discount_percentage}% birthday discount will be applied at checkout!`);
    }

    setShowBanner(false);
  };

  if (!isBirthday || !showBanner) return null;

  return (
    <>
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -100,
                  rotate: 0,
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 720,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  ease: 'linear',
                }}
                className="absolute w-3 h-3"
                style={{
                  backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][
                    Math.floor(Math.random() * 5)
                  ],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Birthday Banner */}
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20" />
        </div>

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -10, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="flex-shrink-0"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Cake className="w-8 h-8" />
              </div>
            </motion.div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">
                🎂 Happy Birthday!
              </h3>
              <p className="text-lg opacity-95">
                {offer?.type === 'free_item'
                  ? `Enjoy a free ${offer.item_name} on us today!`
                  : offer?.type === 'discount'
                  ? `Get ${offer.discount_percentage}% off your entire order!`
                  : 'Special birthday treat waiting for you!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClaimOffer}
              className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Gift className="w-5 h-5" />
              Claim Now
            </motion.button>

            <button
              onClick={() => setShowBanner(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validity Notice */}
        <div className="relative mt-4 pt-4 border-t border-white/20">
          <p className="text-sm opacity-90">
            ⏰ Valid for today only • Offer expires at midnight
          </p>
        </div>
      </motion.div>
    </>
  );
}
