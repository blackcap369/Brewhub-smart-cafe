import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Package,
  Coffee,
  X,
  Home,
  ChefHat,
  Database,
} from 'lucide-react';
import { useAppStore } from '../../stores';

const mobileLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/menu', label: 'Menu', icon: Coffee },
  { href: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/menu', label: 'Menu Items', icon: UtensilsCrossed },
  { href: '/kitchen', label: 'Kitchen Display', icon: Package },
  { href: '/schema', label: 'DB Schema', icon: Database },
];

export default function MobileNav() {
  const { mobileMenuOpen, setMobileMenuOpen } = useAppStore();
  const location = useLocation();

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <Coffee className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">BrewHub</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Nav */}
            <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-5rem)]">
              {mobileLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <link.icon className="w-4.5 h-4.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
