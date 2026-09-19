import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CafeLoyalty {
  cafeId: string;
  ordersCount: number;
  points: number;
  lastRedeemed: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
}

interface LoyaltyState {
  cafes: Record<string, CafeLoyalty>;
  initializeCafe: (cafeId: string) => void;
  incrementOrder: (cafeId: string) => void;
  addPoints: (cafeId: string, points: number) => void;
  redeemReward: (cafeId: string) => void;
  getLoyaltyStatus: (cafeId: string) => CafeLoyalty | null;
  isEligibleForReward: (cafeId: string) => boolean;
  getOrdersUntilReward: (cafeId: string) => number;
  isInCooldown: (cafeId: string) => boolean;
  getCooldownRemaining: (cafeId: string) => number; // minutes
  calculateTier: (ordersCount: number, totalSpent: number) => 'bronze' | 'silver' | 'gold' | 'platinum';
}

const ORDERS_PER_REWARD = 7;
const COOLDOWN_HOURS = 6;
const COOLDOWN_MINUTES = COOLDOWN_HOURS * 60;

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      cafes: {},

      initializeCafe: (cafeId: string) => {
        const cafes = get().cafes;
        if (!cafes[cafeId]) {
          set({
            cafes: {
              ...cafes,
              [cafeId]: {
                cafeId,
                ordersCount: 0,
                points: 0,
                lastRedeemed: null,
                tier: 'bronze',
                totalSpent: 0,
              },
            },
          });
        }
      },

      incrementOrder: (cafeId: string) => {
        const cafes = get().cafes;
        const cafe = cafes[cafeId];
        
        if (!cafe) {
          get().initializeCafe(cafeId);
          return;
        }

        const newOrdersCount = cafe.ordersCount + 1;
        const newTier = get().calculateTier(newOrdersCount, cafe.totalSpent);

        set({
          cafes: {
            ...cafes,
            [cafeId]: {
              ...cafe,
              ordersCount: newOrdersCount,
              tier: newTier,
            },
          },
        });
      },

      addPoints: (cafeId: string, points: number) => {
        const cafes = get().cafes;
        const cafe = cafes[cafeId];
        
        if (!cafe) return;

        set({
          cafes: {
            ...cafes,
            [cafeId]: {
              ...cafe,
              points: cafe.points + points,
            },
          },
        });
      },

      redeemReward: (cafeId: string) => {
        const cafes = get().cafes;
        const cafe = cafes[cafeId];
        
        if (!cafe || !get().isEligibleForReward(cafeId)) return;

        set({
          cafes: {
            ...cafes,
            [cafeId]: {
              ...cafe,
              ordersCount: 0, // Reset counter
              lastRedeemed: new Date().toISOString(),
            },
          },
        });
      },

      getLoyaltyStatus: (cafeId: string) => {
        return get().cafes[cafeId] || null;
      },

      isEligibleForReward: (cafeId: string) => {
        const cafe = get().cafes[cafeId];
        if (!cafe) return false;

        // Check if reached 7 orders
        if (cafe.ordersCount < ORDERS_PER_REWARD) return false;

        // Check cooldown
        if (get().isInCooldown(cafeId)) return false;

        return true;
      },

      getOrdersUntilReward: (cafeId: string) => {
        const cafe = get().cafes[cafeId];
        if (!cafe) return ORDERS_PER_REWARD;

        const remaining = ORDERS_PER_REWARD - (cafe.ordersCount % ORDERS_PER_REWARD);
        return remaining === ORDERS_PER_REWARD ? 0 : remaining;
      },

      isInCooldown: (cafeId: string) => {
        const cafe = get().cafes[cafeId];
        if (!cafe || !cafe.lastRedeemed) return false;

        const lastRedeemed = new Date(cafe.lastRedeemed).getTime();
        const now = Date.now();
        const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

        return now - lastRedeemed < cooldownMs;
      },

      getCooldownRemaining: (cafeId: string) => {
        const cafe = get().cafes[cafeId];
        if (!cafe || !cafe.lastRedeemed) return 0;

        const lastRedeemed = new Date(cafe.lastRedeemed).getTime();
        const now = Date.now();
        const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
        const remainingMs = cooldownMs - (now - lastRedeemed);

        return Math.max(0, Math.ceil(remainingMs / (60 * 1000))); // minutes
      },

      calculateTier: (ordersCount: number, totalSpent: number) => {
        if (totalSpent >= 5000 || ordersCount >= 50) return 'platinum';
        if (totalSpent >= 2000 || ordersCount >= 25) return 'gold';
        if (totalSpent >= 500 || ordersCount >= 10) return 'silver';
        return 'bronze';
      },
    }),
    {
      name: 'brewhub-loyalty',
      partialize: (state) => ({ cafes: state.cafes }),
    }
  )
);
