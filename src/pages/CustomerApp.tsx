import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ShoppingCart, X, Leaf, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { parseQRCode, getQRDataFromLocation } from '../utils/qrParser';
import type { DatabaseMenuItem, QRError } from '../types';
import MenuItemCard from '../components/MenuItemCard';
import CategoryTabs from '../components/CategoryTabs';

interface CartItem {
  item: DatabaseMenuItem;
  quantity: number;
}

type SortOption = 'default' | 'price-low' | 'price-high' | 'popular';
type VegFilter = 'all' | 'veg' | 'non-veg';

export default function CustomerApp() {
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [vegFilter, setVegFilter] = useState<VegFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [qrError, setQrError] = useState<QRError | null>(null);

  // Parse QR code data from URL
  const qrData = useMemo(() => {
    const data = getQRDataFromLocation();
    if (data && 'error' in data) {
      setQrError(data);
      return null;
    }
    return data;
  }, [searchParams]);

  // Fetch menu items from Supabase
  const {
    data: menuItems = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['menuItems', qrData?.cafeId],
    queryFn: async () => {
      if (!qrData?.cafeId) return [];

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('cafe_id', qrData.cafeId)
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('is_popular', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as DatabaseMenuItem[];
    },
    enabled: !!qrData?.cafeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((item) => item.category));
    return ['All', ...Array.from(cats).sort()];
  }, [menuItems]);

  // Filter and sort menu items
  const filteredItems = useMemo(() => {
    let items = [...menuItems];

    // Category filter
    if (activeCategory !== 'All') {
      items = items.filter((item) => item.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    // Veg filter
    if (vegFilter === 'veg') {
      items = items.filter((item) => item.is_veg);
    } else if (vegFilter === 'non-veg') {
      items = items.filter((item) => !item.is_veg);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        items.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0));
        break;
      default:
        // Default sort: popular first, then by name
        items.sort((a, b) => {
          if (a.is_popular && !b.is_popular) return -1;
          if (!a.is_popular && b.is_popular) return 1;
          return a.name.localeCompare(b.name);
        });
    }

    return items;
  }, [menuItems, activeCategory, searchQuery, vegFilter, sortBy]);

  // Cart functions
  const addToCart = (item: DatabaseMenuItem) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(item.id);

      if (existing) {
        newCart.set(item.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        newCart.set(item.id, { item, quantity: 1 });
      }

      return newCart;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(itemId);

      if (existing) {
        if (existing.quantity > 1) {
          newCart.set(itemId, { ...existing, quantity: existing.quantity - 1 });
        } else {
          newCart.delete(itemId);
        }
      }

      return newCart;
    });
  };

  const getItemQuantity = (itemId: string) => {
    return cart.get(itemId)?.quantity || 0;
  };

  const cartTotal = useMemo(() => {
    return Array.from(cart.values()).reduce(
      (sum, { item, quantity }) => sum + item.price * quantity,
      0
    );
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return Array.from(cart.values()).reduce((sum, { quantity }) => sum + quantity, 0);
  }, [cart]);

  // Show error state
  if (qrError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h2>
          <p className="text-gray-600 mb-6">{qrError.error}</p>
          <p className="text-sm text-gray-500">
            Please scan the QR code from your table or contact staff for assistance.
          </p>
        </motion.div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </div>

        {/* Search skeleton */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Category tabs skeleton */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 rounded-full w-24 animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Menu items skeleton */}
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="h-40 bg-gray-200 animate-pulse" />
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-4 animate-pulse" />
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Menu</h2>
          <p className="text-gray-600 mb-6">
            {fetchError.message || 'Unable to load menu items. Please try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Table {qrData?.tableNo}
              </h1>
              <p className="text-sm text-gray-600">
                {menuItems.length} items available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                showFilters || vegFilter !== 'all' || sortBy !== 'default'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Filter options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 pb-1 flex flex-wrap gap-3">
                  {/* Veg filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Diet:</span>
                    <div className="flex gap-1">
                      {(['all', 'veg', 'non-veg'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setVegFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            vegFilter === filter
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {filter === 'all' ? 'All' : filter === 'veg' ? '🥬 Veg' : '🍗 Non-Veg'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="default">Default</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'No items available in this category'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={getItemQuantity(item.id)}
                  onAdd={() => addToCart(item)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={() => {
              // TODO: Navigate to cart/checkout page
              console.log('Cart:', Array.from(cart.values()));
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-white text-primary-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium opacity-90">View Cart</div>
              <div className="text-lg font-bold">₹{cartTotal.toFixed(2)}</div>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
}
