import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShoppingBag } from 'lucide-react';
import type { DatabaseMenuItem } from '../types';

interface FreeItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: DatabaseMenuItem[];
  onConfirm: (selectedItems: DatabaseMenuItem[]) => void;
  maxItems?: number;
}

export default function FreeItemSelector({
  isOpen,
  onClose,
  menuItems,
  onConfirm,
  maxItems = 2,
}: FreeItemSelectorProps) {
  const [selectedItems, setSelectedItems] = useState<DatabaseMenuItem[]>([]);

  const handleToggleItem = (item: DatabaseMenuItem) => {
    const isSelected = selectedItems.find((i) => i.id === item.id);
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else if (selectedItems.length < maxItems) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleConfirm = () => {
    if (selectedItems.length > 0) {
      onConfirm(selectedItems);
      setSelectedItems([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedItems([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingBag className="w-7 h-7" />
                    Choose Your Free Items
                  </h2>
                  <p className="text-primary-100 mt-1">
                    Select up to {maxItems} items from our menu
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menuItems.map((item) => {
                  const isSelected = selectedItems.find((i) => i.id === item.id);
                  
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleItem(item)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}

                      {/* Item Image */}
                      <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="w-12 h-12 text-gray-400" />
                        )}
                      </div>

                      {/* Item Details */}
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.is_veg && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Veg
                          </span>
                        )}
                        {item.is_spicy && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                            🌶️ Spicy
                          </span>
                        )}
                        {item.is_popular && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                            ⭐ Popular
                          </span>
                        )}
                      </div>

                      {/* Price (shown as crossed out) */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          ₹{item.price.toFixed(2)}
                        </span>
                        <span className="text-sm font-bold text-primary-600">FREE</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Selected: <span className="font-semibold text-gray-900">{selectedItems.length}</span> / {maxItems}
                  </p>
                  {selectedItems.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedItems.map((item) => item.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-lg font-bold text-primary-600">
                    ₹{selectedItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedItems.length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl shadow-lg transition-all disabled:cursor-not-allowed"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
