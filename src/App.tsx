import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MobileNav from './components/layout/MobileNav';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load routes for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MarketingLanding = lazy(() => import('./pages/MarketingLanding'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Menu = lazy(() => import('./pages/Menu'));
const Kitchen = lazy(() => import('./pages/Kitchen'));
const KitchenDashboard = lazy(() => import('./pages/KitchenDashboard').then(m => ({ default: m.KitchenDashboard })));
const Admin = lazy(() => import('./pages/Admin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Overview = lazy(() => import('./components/admin/Overview'));
const FloorMap = lazy(() => import('./components/admin/FloorMap'));
const MenuManagement = lazy(() => import('./components/admin/MenuManagement'));
const Analytics = lazy(() => import('./components/admin/Analytics'));
const Broadcasts = lazy(() => import('./pages/Broadcasts'));
const FeedbackPage = lazy(() => import('./pages/Feedback'));
const BirthdayPage = lazy(() => import('./pages/Birthday'));
const StaffManagement = lazy(() => import('./components/admin/StaffManagement').then(m => ({ default: m.StaffManagement })));
const AdminReservations = lazy(() => import('./components/admin/AdminReservations'));
const Inventory = lazy(() => import('./components/admin/Inventory'));
const InventoryReports = lazy(() => import('./components/admin/InventoryReports'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const SchemaDocs = lazy(() => import('./pages/SchemaDocs'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CustomerApp = lazy(() => import('./pages/CustomerApp'));
const Reservations = lazy(() => import('./pages/Reservations'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isKitchen = location.pathname === '/kitchen';
  const isKitchenDashboard = location.pathname === '/kitchen-dashboard';
  const isCustomerApp = location.pathname === '/customer';
  const isAdminDashboard = location.pathname.startsWith('/admin-dashboard');
  const isOnboarding = location.pathname === '/onboarding';
  const isLanding = location.pathname === '/';

  if (isKitchen || isKitchenDashboard || isCustomerApp || isAdminDashboard || isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MobileNav />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner fullScreen text="Loading..." />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketing" element={<MarketingLanding />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/customer" element={<CustomerApp />} />
          <Route path="/kitchen" element={
            <ProtectedRoute requiredRole={['owner', 'manager', 'staff', 'kitchen']}>
              <Kitchen />
            </ProtectedRoute>
          } />
          <Route path="/kitchen-dashboard" element={
            <ProtectedRoute requiredRole={['owner', 'manager', 'staff', 'kitchen']}>
              <KitchenDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute requiredRole={['owner', 'manager', 'staff']}>
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path="floor-map" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <FloorMap />
              </ProtectedRoute>
            } />
            <Route path="menu" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <MenuManagement />
              </ProtectedRoute>
            } />
            <Route path="analytics" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <Analytics cafeId="demo-cafe-id" />
              </ProtectedRoute>
            } />
            <Route path="broadcasts" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <Broadcasts cafeId="demo-cafe-id" />
              </ProtectedRoute>
            } />
            <Route path="feedback" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <FeedbackPage cafeId="demo-cafe-id" />
              </ProtectedRoute>
            } />
            <Route path="birthday" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <BirthdayPage cafeId="demo-cafe-id" />
              </ProtectedRoute>
            } />
            <Route path="staff" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <StaffManagement />
              </ProtectedRoute>
            } />
            <Route path="reservations" element={
              <ProtectedRoute requiredRole={['owner', 'manager', 'staff']}>
                <AdminReservations cafeId="demo-cafe-id" />
              </ProtectedRoute>
            } />
            <Route path="inventory" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <Inventory cafeId="demo-cafe-id" />
              </ProtectedRoute>
            } />
            <Route path="inventory/reports" element={
              <ProtectedRoute requiredRole={['owner', 'manager']}>
                <InventoryReports cafeId="demo-cafe-id" />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/order/:orderId" element={<OrderTracking />} />
          <Route path="/schema" element={<SchemaDocs />} />
          <Route
            path="*"
            element={
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
                  <p className="text-gray-500 mb-6">Page not found</p>
                  <a
                    href="/"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Layout>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
