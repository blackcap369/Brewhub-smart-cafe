import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Users,
  Settings,
  BarChart3,
  Coffee,
  Package,
  CreditCard,
  Database,
  ChefHat,
} from 'lucide-react';
import { useAppStore } from '../../stores';

const sidebarLinks = [
  {
    group: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
      { href: '/admin/menu', label: 'Menu Items', icon: UtensilsCrossed },
    ],
  },
  {
    group: 'Operations',
    items: [
      { href: '/kitchen', label: 'Kitchen Display', icon: Package },
      { href: '/kitchen-dashboard', label: 'KDS Dashboard', icon: ChefHat },
      { href: '/admin/tables', label: 'Tables', icon: Coffee },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { href: '/admin/staff', label: 'Staff', icon: Users },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    group: 'Developer',
    items: [
      { href: '/schema', label: 'DB Schema', icon: Database },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {sidebarLinks.map((group) => (
          <div key={group.group} className="mb-6">
            <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {group.group}
            </h3>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 w-0.5 h-6 bg-primary-500 rounded-r"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="p-3 border-t border-gray-100">
        <div className="bg-gradient-to-br from-primary-50 to-amber-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-primary-800 mb-1">Pro Plan</p>
          <p className="text-[11px] text-gray-600 mb-3">
            Unlimited orders, analytics & support
          </p>
          <button className="w-full py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}
