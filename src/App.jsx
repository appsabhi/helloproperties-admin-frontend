import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import { ActivityProvider } from './context/ActivityContext';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import SellProperties from './pages/SellProperties';
import BuyRequirements from './pages/BuyRequirements';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Activities from './pages/Activities';
import PublicPropertyDetail from './pages/PublicPropertyDetail';
import PublicNotice from './pages/PublicNotice';

// Protected Route Component consuming real AuthContext
function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingAuth } = useContext(AuthContext);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 bg-[#F7F7F7] z-50 flex flex-col items-center justify-center space-y-3 font-sans text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-[#B0004F]" />
        <p className="text-xs font-semibold">Verifying secure admin session...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Layout>{children}</Layout>;
}

// Admin-Only Route Guard restricting User Management to Admin users
function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoadingAuth } = useContext(AuthContext);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 bg-[#F7F7F7] z-50 flex flex-col items-center justify-center space-y-3 font-sans text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-[#B0004F]" />
        <p className="text-xs font-semibold">Verifying admin permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Guard for Root & Public entry points: Authenticated -> /dashboard, Unauthenticated -> PublicNotice
function RootOrPublicRoute() {
  const { isAuthenticated, isLoadingAuth } = useContext(AuthContext);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 bg-[#F7F7F7] z-50 flex flex-col items-center justify-center space-y-3 font-sans text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-[#B0004F]" />
        <p className="text-xs font-semibold">Loading HelloProperties...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PublicNotice />;
}

export default function App() {
  const isPublicMode = import.meta.env.VITE_APP_MODE === 'public';

  if (isPublicMode) {
    return (
      <PropertyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/property/:id" element={<PublicPropertyDetail />} />
            <Route path="/p/:id" element={<PublicPropertyDetail />} />
            <Route path="/share/:id" element={<PublicPropertyDetail />} />
            <Route path="*" element={<PublicNotice />} />
          </Routes>
        </BrowserRouter>
      </PropertyProvider>
    );
  }

  return (
    <AuthProvider>
      <PropertyProvider>
        <ActivityProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Login />} />
              <Route path="/property/:id" element={<PublicPropertyDetail />} />
              <Route path="/p/:id" element={<PublicPropertyDetail />} />
              <Route path="/share/:id" element={<PublicPropertyDetail />} />

              {/* Root Domain & Non-ID Public Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/p" element={<RootOrPublicRoute />} />
              <Route path="/property" element={<RootOrPublicRoute />} />
              <Route path="/share" element={<RootOrPublicRoute />} />

              {/* Protected Internal Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties"
                element={
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/listings"
                element={
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/requirements"
                element={
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/buy"
                element={
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/sell"
                element={
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <AdminRoute>
                    <Activities />
                  </AdminRoute>
                }
              />

              {/* Fallback Catch-All */}
              <Route path="*" element={<RootOrPublicRoute />} />
            </Routes>
          </BrowserRouter>
        </ActivityProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

