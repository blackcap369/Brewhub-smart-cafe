import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { generateTimeSlots, createPreOrder } from '../services/preOrderService';
import TimeSlotSelector from './TimeSlotSelector';
import { useCartStore } from '../stores/cartStore';
import { useToast } from '../contexts/ToastContext';

interface PreOrderFlowProps {
  cafeId: string;
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export default function PreOrderFlow({
  cafeId,
  customerId,
  isOpen,
  onClose,
  onSuccess,
}: PreOrderFlowProps) {
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cart = useCartStore();
  const toast = useToast();

  // Generate next 4 days (today + 3 days)
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 4; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  }, []);

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleBack = () => {
    if (step === 'time') {
      setStep('date');
      setSelectedTime(null);
    } else if (step === 'confirm') {
      setStep('time');
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);

    try {
      // Combine date and time
      const scheduledTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      scheduledTime.setHours(hours, minutes, 0, 0);

      const result = await createPreOrder({
        cafeId,
        customerId,
        items: cart.items,
        scheduledTime: scheduledTime.toISOString(),
        subtotal: cart.getSubtotal(),
        tax: cart.getTax(),
        total: cart.getTotal(),
      });

      if (result.success && result.orderId) {
        toast.success('Pre-order placed successfully!');
        cart.clearCart();
        onSuccess(result.orderId);
        onClose();
      } else {
        toast.error(result.error || 'Failed to place pre-order');
      }
    } catch (error: any) {
      console.error('Error placing pre-order:', error);
      toast.error('Failed to place pre-order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, addDays(today, 1))) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  const formatScheduledTime = () => {
    if (!selectedDate || !selectedTime) return '';
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return format(dateTime, 'EEEE, MMMM d, yyyy "at" h:mm a');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Schedule Pre-Order</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {step === 'date' && 'Select a date for your order'}
                  {step === 'time' && 'Choose a time slot'}
                  {step === 'confirm' && 'Review and confirm your order'}
                </p>
              </div>
              {step !== 'date' && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div className={`flex items-center gap-2 ${step === 'date' ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'date' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Date</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200">
                <div className={`h-full transition-all ${
                  step === 'time' || step === 'confirm' ? 'bg-primary-600 w-full' : 'w-0'
                }`} />
              </div>
              <div className={`flex items-center gap-2 ${step === 'time' ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'time' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Time</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200">
                <div className={`h-full transition-all ${
                  step === 'confirm' ? 'bg-primary-600 w-full' : 'w-0'
                }`} />
              </div>
              <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'confirm' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Confirm</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Date Selection */}
              {step === 'date' && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {availableDates.map((date) => {
                      const isSelected = selectedDate && isSameDay(date, selectedDate);
                      return (
                        <motion.button
                          key={date.toISOString()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDateSelect(date)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="text-sm text-gray-600">
                            {formatDateLabel(date)}
                          </div>
                          <div className="text-lg font-semibold text-gray-900 mt-1">
                            {format(date, 'MMM d')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {format(date, 'yyyy')}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Time Selection */}
              {step === 'time' && (
                <motion.div
                  key="time"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Selected Date:</span>{' '}
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <TimeSlotSelector
                    slots={timeSlots}
                    selectedSlot={selectedTime}
                    onSlotSelect={handleTimeSelect}
                  />
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Scheduled Time */}
                  <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Scheduled for</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatScheduledTime()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="text-gray-900">₹{cart.getSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax (5% GST)</span>
                          <span className="text-gray-900">₹{cart.getTax().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold mt-2">
                          <span className="text-gray-900">Total</span>
                          <span className="text-primary-600">₹{cart.getTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Notice */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">
                      <span className="font-semibold">Payment Required:</span> Full payment is required upfront for pre-orders.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Confirm Pre-Order
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
