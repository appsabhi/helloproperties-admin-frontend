import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import SellProperties from './pages/SellProperties';
import BuyRequirements from './pages/BuyRequirements';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';

// Protected Route Component consuming real AuthContext
function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingAuth } = useContext(AuthContext);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center space-y-3 font-sans text-slate-600">
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
      <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center space-y-3 font-sans text-slate-600">
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

export default function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirects to /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </PropertyProvider>
  </AuthProvider>
  );
}
