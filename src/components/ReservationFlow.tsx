import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, MessageSquare, User, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { getAvailableTimeSlots, createReservation } from '../services/reservationService';
import type { TimeSlot } from '../services/reservationService';

interface ReservationFlowProps {
  cafeId: string;
  customerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reservationId: string) => void;
}

export default function ReservationFlow({
  cafeId,
  customerId,
  isOpen,
  onClose,
  onSuccess,
}: ReservationFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Generate next 7 days
  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Load available time slots when date or guests change
  useEffect(() => {
    if (selectedDate && isOpen) {
      loadTimeSlots();
    }
  }, [selectedDate, guests, isOpen]);

  const loadTimeSlots = async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError('');

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const result = await getAvailableTimeSlots(cafeId, dateStr, guests);

    if (result.success && result.slots) {
      setAvailableSlots(result.slots);
    } else {
      setError(result.error || 'Failed to load available time slots');
      setAvailableSlots([]);
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !customerName || !customerPhone) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await createReservation({
      cafe_id: cafeId,
      customer_id: customerId,
      reservation_date: format(selectedDate, 'yyyy-MM-dd'),
      time_slot: selectedTime,
      guests,
      special_requests: specialRequests || undefined,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || undefined,
    });

    if (result.success && result.reservation) {
      setStep(6); // Show confirmation
      setTimeout(() => {
        onSuccess?.(result.reservation!.id);
        handleClose();
      }, 3000);
    } else {
      setError(result.error || 'Failed to create reservation');
    }

    setSubmitting(false);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedDate(null);
    setSelectedTime('');
    setGuests(2);
    setSpecialRequests('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setAvailableSlots([]);
    setError('');
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedDate !== null;
      case 2:
        return selectedTime !== '';
      case 3:
        return guests > 0;
      case 4:
        return true; // Special requests are optional
      case 5:
        return customerName !== '' && customerPhone !== '';
      default:
        return false;
    }
  };

  const formatTimeSlot = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reserve a Table
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Step {step} of 6
                </p>
              </div>
              {step > 1 && step < 6 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    s <= step ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Date */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-6 h-6 text-primary-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Select Date
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableDates.map((date) => {
                      const isSelected = selectedDate && isSameDay(date, selectedDate);
                      const isToday = isSameDay(date, new Date());

                      return (
                        <motion.button
                          key={date.toISOString()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedDate(date)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                          }`}
                        >
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {isToday ? 'Today' : format(date, 'EEEE')}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {format(date, 'd')}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {format(date, 'MMM')}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Select Time */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-6 h-6 text-primary-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Select Time
                    </h3>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Loading available times...
                      </p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No available time slots for {guests} guests on this date.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Try a different date or party size.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time_slot;
                        const availabilityPercent = (slot.available_tables / slot.total_tables) * 100;

                        return (
                          <motion.button
                            key={slot.time_slot}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTime(slot.time_slot)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                            }`}
                          >
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatTimeSlot(slot.time_slot)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {slot.available_tables} table{slot.available_tables !== 1 ? 's' : ''} available
                            </div>
                            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  availabilityPercent > 50
                                    ? 'bg-green-500'
                                    : availabilityPercent > 25
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${availabilityPercent}%` }}
                              />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Number of Guests */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-6 h-6 text-primary-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Number of Guests
                    </h3>
                  </div>

                  <div className="flex items-center justify-center gap-4 py-8">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                      className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300 hover:border-primary-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      -
                    </button>
                    <div className="text-6xl font-bold text-gray-900 dark:text-white w-24 text-center">
                      {guests}
                    </div>
                    <button
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                      disabled={guests >= 20}
                      className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300 hover:border-primary-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-center text-gray-600 dark:text-gray-400">
                    {guests === 1 && 'Table for 1'}
                    {guests > 1 && guests <= 4 && `Table for ${guests} guests`}
                    {guests > 4 && guests <= 8 && `Large table for ${guests} guests`}
                    {guests > 8 && `Group booking for ${guests} guests`}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Special Requests */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-6 h-6 text-primary-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Special Requests
                    </h3>
                  </div>

                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests? (e.g., birthday celebration, high chair needed, window seat preferred)"
                    rows={5}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {specialRequests.length}/500 characters
                  </p>
                </motion.div>
              )}

              {/* Step 5: Contact Details */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-6 h-6 text-primary-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Contact Details
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Confirmation */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Reservation Confirmed!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We'll send you a reminder before your reservation.
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-left space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedTime && formatTimeSlot(selectedTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Guests:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {guests}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {customerName}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          {step < 6 && (
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              {step < 5 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canProceed()}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Reservation
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
