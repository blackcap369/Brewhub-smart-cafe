import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, Star, Flame } from 'lucide-react';
import type { DatabaseMenuItem } from '../types';
import { getTranslatedName, getTranslatedDescription } from '../utils/translations';

interface MenuItemCardProps {
  item: DatabaseMenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function MenuItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
}: MenuItemCardProps) {
  const { t, i18n } = useTranslation();
  
  // Get translated content
  const translatedName = getTranslatedName(item as any, i18n.language);
  const translatedDescription = getTranslatedDescription(item as any, i18n.language);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image Section */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* Veg/Non-veg indicator */}
          <div
            className={`w-6 h-6 border-2 rounded flex items-center justify-center bg-white ${
              item.is_veg ? 'border-green-600' : 'border-red-600'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                item.is_veg ? 'bg-green-600' : 'bg-red-600'
              }`}
            />
          </div>
        </div>

        {/* Popular badge */}
        {item.is_popular && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
            <Star className="w-3 h-3 fill-white" />
            {t('menu.popular')}
          </div>
        )}

        {/* Spicy indicator */}
        {item.is_spicy && (
          <div className="absolute bottom-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md">
            <Flame className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
          {translatedName}
        </h3>
        
        {translatedDescription && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {translatedDescription}
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* Price */}
          <div className="text-2xl font-bold text-gray-900">
            ₹{item.price.toFixed(2)}
          </div>

          {/* Add to cart button */}
          {quantity === 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onAdd}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {t('menu.addToCart')}
            </motion.button>
          ) : (
            <div className="flex items-center gap-2 bg-primary-50 border-2 border-primary-600 rounded-lg">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onRemove}
                className="p-2 text-primary-600 hover:bg-primary-100 rounded-l-md transition-colors"
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              
              <span className="font-bold text-primary-700 min-w-[2rem] text-center">
                {quantity}
              </span>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAdd}
                className="p-2 text-primary-600 hover:bg-primary-100 rounded-r-md transition-colors"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
