import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Mail, MessageSquare, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { format, addDays, isSameDay, startOfWeek, addWeeks } from 'date-fns';
import { getReservations, checkInReservation, completeReservation, cancelReservation, assignTable, updateReservationNotes, markNoShows } from '../../services/reservationService';
import type { Reservation } from '../../services/reservationService';

interface AdminReservationsProps {
  cafeId: string;
}

export default function AdminReservations({ cafeId }: AdminReservationsProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'checked_in'>('all');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [notes, setNotes] = useState('');

  // Generate next 14 days for calendar
  const calendarDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    loadReservations();
  }, [selectedDate, cafeId]);

  const loadReservations = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const result = await getReservations(cafeId, dateStr);

    if (result.success && result.reservations) {
      setReservations(result.reservations);
    }
    setLoading(false);
  };

  const handleCheckIn = async (reservationId: string) => {
    const result = await checkInReservation(reservationId);
    if (result.success) {
      await loadReservations();
    }
  };

  const handleComplete = async (reservationId: string) => {
    const result = await completeReservation(reservationId);
    if (result.success) {
      await loadReservations();
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    const result = await cancelReservation(reservationId, 'Cancelled by staff');
    if (result.success) {
      await loadReservations();
    }
  };

  const handleMarkNoShow = async () => {
    const result = await markNoShows();
    if (result.success) {
      alert(`Marked ${result.count} reservation(s) as no-show`);
      await loadReservations();
    }
  };

  const handleSaveNotes = async () => {
    if (!editingReservation) return;

    const result = await updateReservationNotes(editingReservation.id, notes);
    if (result.success) {
      setEditingReservation(null);
      setNotes('');
      await loadReservations();
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'checked_in':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeSlot = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage table reservations and walk-ins
          </p>
        </div>
        <button
          onClick={handleMarkNoShow}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Mark No-Shows
        </button>
      </div>

      {/* Calendar Strip */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {calendarDates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const dayReservations = reservations.filter((r) =>
              isSameDay(new Date(r.reservation_date), date)
            ).length;

            return (
              <motion.button
                key={date.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 w-20 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {isToday ? 'Today' : format(date, 'EEE')}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {format(date, 'd')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {format(date, 'MMM')}
                </div>
                {dayReservations > 0 && (
                  <div className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {dayReservations} reservation{dayReservations !== 1 ? 's' : ''}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All ({reservations.length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'confirmed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Confirmed ({reservations.filter((r) => r.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('checked_in')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'checked_in'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Checked In ({reservations.filter((r) => r.status === 'checked_in').length})
        </button>
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reservations...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No reservations for this date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {reservation.customer_name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                      {reservation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeSlot(reservation.time_slot)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{reservation.guests} guest{reservation.guests !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{reservation.customer_phone}</span>
                      </div>
                      {reservation.customer_email && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{reservation.customer_email}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {reservation.special_requests && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Special Requests:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reservation.special_requests}
                            </p>
                          </div>
                        </div>
                      )}
                      {reservation.notes && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Staff Notes:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reservation.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {reservation.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => handleCheckIn(reservation.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Check In
                      </button>
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                  {reservation.status === 'checked_in' && (
                    <button
                      onClick={() => handleComplete(reservation.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingReservation(reservation);
                      setNotes(reservation.notes || '');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Notes
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {editingReservation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingReservation(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Staff Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this reservation..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditingReservation(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Save Notes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
