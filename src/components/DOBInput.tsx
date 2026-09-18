import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Cake, Gift } from 'lucide-react';
import { updateCustomerDOB } from '../services/birthdayService';
import { useToast } from '../contexts/ToastContext';

interface DOBInputProps {
  customerId: string;
  currentDOB?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function DOBInput({ customerId, currentDOB, onSuccess, onClose }: DOBInputProps) {
  const [dob, setDob] = useState(currentDOB ? new Date(currentDOB).toISOString().split('T')[0] : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dob) {
      toast.error('Please select your date of birth');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateCustomerDOB(customerId, dob);
      
      if (result.success) {
        setShowSuccess(true);
        toast.success('🎂 Date of birth saved successfully!');
        
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to save date of birth');
      }
    } catch (error) {
      console.error('Error saving DOB:', error);
      toast.error('Failed to save date of birth');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate if birthday is today
  const isBirthdayToday = () => {
    if (!dob) return false;
    const today = new Date();
    const birthday = new Date(dob);
    return (
      birthday.getMonth() === today.getMonth() &&
      birthday.getDate() === today.getDate()
    );
  };

  return (
    <AnimatePresence mode="wait">
      {showSuccess ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white p-8 rounded-2xl shadow-2xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Cake className="w-10 h-10" />
            </div>
          </motion.div>
          
          <h3 className="text-2xl font-bold mb-2">
            {isBirthdayToday() ? '🎉 Happy Birthday!' : '✨ Thank You!'}
          </h3>
          <p className="text-lg opacity-95 mb-4">
            {isBirthdayToday()
              ? "We've saved your birthday. Enjoy your special day!"
              : "We've saved your birthday. We'll make sure to celebrate with you!"}
          </p>
          
          {isBirthdayToday() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">Special Birthday Treat!</span>
              </div>
              <p className="text-sm opacity-90">
                Check your birthday banner for your exclusive offer
              </p>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  When's Your Birthday?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We'll send you a special treat on your big day! 🎂
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                🔒 Your date of birth is kept private and secure
              </p>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-1">
                    Birthday Benefits
                  </p>
                  <ul className="text-xs text-pink-700 dark:text-pink-300 space-y-1">
                    <li>✓ Free treat on your birthday</li>
                    <li>✓ Special birthday notifications</li>
                    <li>✓ Exclusive birthday offers</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !dob}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Save Birthday
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
