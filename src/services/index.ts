export {
  supabase,
  setCafeContext,
  getCurrentCafeInfo,
  getUserRole,
  createOrder,
  updateOrderStatus,
  processPayment,
  submitFeedback,
  getDashboardStats,
} from './supabase';

export {
  sendOTP,
  verifyOTP,
  getCurrentUser,
  getCurrentSession,
  logout,
  onAuthStateChange,
  refreshSession,
} from './authService';

export { default as api } from './api';
