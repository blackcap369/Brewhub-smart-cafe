import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star } from 'lucide-react';
import type { TimeSlot } from '../services/preOrderService';

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSlotSelect: (slot: string) => void;
}

export default function TimeSlotSelector({
  slots,
  selectedSlot,
  onSlotSelect,
}: TimeSlotSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>Select a time slot</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.time;
          const isDisabled = !slot.available;

          return (
            <motion.button
              key={slot.time}
              whileHover={!isDisabled ? { scale: 1.05 } : undefined}
              whileTap={!isDisabled ? { scale: 0.95 } : undefined}
              onClick={() => !isDisabled && onSlotSelect(slot.time)}
              disabled={isDisabled}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className="text-sm font-medium">{slot.label}</div>
              
              {slot.popular && !isDisabled && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-amber-400 rounded-full p-1">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>
              )}

              {isDisabled && (
                <div className="text-xs mt-1">Past</div>
              )}
            </motion.button>
          );
        })}
      </div>

      {slots.filter(s => s.popular && s.available).length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>Popular time slots</span>
        </div>
      )}
    </div>
  );
}
