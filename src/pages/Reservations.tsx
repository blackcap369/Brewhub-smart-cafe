import { useState } from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import ReservationFlow from '../components/ReservationFlow';

export default function Reservations() {
  const [showReservationFlow, setShowReservationFlow] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Reserve a Table
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Book your perfect dining experience in advance
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Easy Booking
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Reserve your table in just a few clicks. Choose your preferred date, time, and party size.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Instant Confirmation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get immediate confirmation and reminders before your reservation.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Special Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Let us know about any special occasions or dietary requirements.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={() => setShowReservationFlow(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Calendar className="w-6 h-6" />
            Make a Reservation
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Reservation Information
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Operating Hours</p>
                <p>Monday - Sunday: 8:00 AM - 10:00 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Reservation Duration</p>
                <p>Standard reservations are for 1.5 hours. Larger parties may require more time.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Cancellation Policy</p>
                <p>Please cancel at least 2 hours before your reservation time. No-shows may affect future bookings.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Large Parties</p>
                <p>For parties of 8 or more, please contact us directly to ensure we can accommodate your group.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Flow Modal */}
      <ReservationFlow
        cafeId="demo-cafe-id" // Replace with actual cafe ID from context
        isOpen={showReservationFlow}
        onClose={() => setShowReservationFlow(false)}
        onSuccess={(reservationId) => {
          console.log('Reservation created:', reservationId);
          // Could show success message or redirect
        }}
      />
    </div>
  );
}
