import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle, Clock, MapPin, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderConfirmationProps {
  orderId: string;
  orderNumber: string;
  estimatedTime: number;
  tableNo: number;
  onClose: () => void;
}

export default function OrderConfirmation({
  orderId,
  orderNumber,
  estimatedTime,
  tableNo,
  onClose,
}: OrderConfirmationProps) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Show details after a short delay
    setTimeout(() => setShowDetails(true), 500);

    return () => clearInterval(interval);
  }, []);

  const handleTrackOrder = () => {
    navigate(`/order/${orderId}`);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'BrewHub Order',
      text: `My order ${orderNumber} is being prepared!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `My BrewHub order ${orderNumber} is being prepared! Track it here: ${window.location.href}/order/${orderId}`
        );
        alert('Order details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Success Header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <CheckCircle className="w-20 h-20 mx-auto mb-4" />
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-2"
          >
            Order Placed Successfully!
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-green-100"
          >
            Your order is being prepared
          </motion.p>
        </div>

        {/* Order Details */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 space-y-4"
          >
            {/* Order Number */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-2xl font-bold text-gray-900">{orderNumber}</p>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Estimated Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {estimatedTime} minutes
                </p>
              </div>
            </div>

            {/* Table Number */}
            <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-4">
              <MapPin className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Table Number</p>
                <p className="text-lg font-semibold text-gray-900">{tableNo}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <button
                onClick={handleTrackOrder}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Track Order
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
            >
              Close
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
