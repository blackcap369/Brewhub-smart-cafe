import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MenuItem, Order, DashboardStats } from '../types';

// Mock data for demonstration - replace with actual API calls
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Espresso',
    description: 'Rich and bold single shot espresso',
    price: 3.5,
    category: 'Coffee',
    isAvailable: true,
    isVeg: true,
    isPopular: true,
    isSpicy: false,
    preparationTime: 3,
    tags: ['hot', 'classic'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam',
    price: 4.5,
    category: 'Coffee',
    isAvailable: true,
    isVeg: true,
    isPopular: true,
    isSpicy: false,
    preparationTime: 5,
    tags: ['hot', 'milk'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Avocado Toast',
    description: 'Sourdough toast with smashed avocado, cherry tomatoes',
    price: 8.0,
    category: 'Food',
    isAvailable: true,
    isVeg: true,
    isPopular: false,
    isSpicy: false,
    preparationTime: 8,
    tags: ['breakfast', 'healthy'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Matcha Latte',
    description: 'Premium Japanese matcha with oat milk',
    price: 5.5,
    category: 'Tea',
    isAvailable: true,
    isVeg: true,
    isPopular: false,
    isSpicy: false,
    preparationTime: 4,
    tags: ['hot', 'matcha'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Croissant',
    description: 'Buttery, flaky French croissant',
    price: 3.0,
    category: 'Pastry',
    isAvailable: true,
    isVeg: true,
    isPopular: true,
    isSpicy: false,
    preparationTime: 2,
    tags: ['breakfast', 'pastry'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Iced Americano',
    description: 'Double shot espresso over ice with cold water',
    price: 4.0,
    category: 'Coffee',
    isAvailable: true,
    isVeg: true,
    isPopular: false,
    isSpicy: false,
    preparationTime: 3,
    tags: ['cold', 'classic'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    items: [],
    status: 'preparing',
    totalAmount: 12.5,
    paymentStatus: 'paid',
    orderType: 'dine_in',
    tableNumber: 3,
    priority: 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    items: [],
    status: 'received',
    totalAmount: 8.0,
    paymentStatus: 'pending',
    orderType: 'pre_order',
    priority: 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockStats: DashboardStats = {
  totalOrders: 156,
  totalRevenue: 4520.5,
  averageOrderValue: 28.97,
  activeOrders: 8,
  todayOrders: 42,
  todayRevenue: 1230.0,
  totalCustomers: 89,
  avgRating: 4.6,
};

// Menu hooks
export function useMenuItems() {
  return useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockMenuItems;
    },
  });
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: ['menuItem', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockMenuItems.find((item) => item.id === id) || null;
    },
  });
}

// Order hooks
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockOrders;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockOrders.find((o) => o.id === id) || null;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { ...orderData, id: Date.now().toString() } as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockStats;
    },
  });
}
