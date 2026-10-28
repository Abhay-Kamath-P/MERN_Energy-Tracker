import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataEntryPage } from './pages/DataEntryPage';
import { MachinesPage } from './pages/MachinesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center text-[#E1DCC9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#E1DCC9] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-wider font-semibold text-[#E1DCC9]/70">
            Connecting to Factory Network...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guard routes based on user role
const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    // Redirect Operator to /entry, Manager/Admin to /
    const defaultFallback = user.role === 'Operator' ? '/entry' : '/';
    return <Navigate to={defaultFallback} replace />;
  }

  return children;
};

export const AppContent = () => {
  const { user } = useAuth();

  const getHomeRedirect = () => {
    if (!user) return '/login';
    return user.role === 'Operator' ? '/entry' : '/';
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={getHomeRedirect()} replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Plant Overview: Manager & Admin */}
        <Route
          index
          element={
            <RoleRoute allowedRoles={['Admin', 'Manager']}>
              <DashboardPage />
            </RoleRoute>
          }
        />

        {/* Shift Data Entry: Operator, Manager, Admin */}
        <Route
          path="entry"
          element={
            <RoleRoute allowedRoles={['Admin', 'Manager', 'Operator']}>
              <DataEntryPage />
            </RoleRoute>
          }
        />

        {/* Visual Analytics: Manager & Admin */}
        <Route
          path="analytics"
          element={
            <RoleRoute allowedRoles={['Admin', 'Manager']}>
              <AnalyticsPage />
            </RoleRoute>
          }
        />

        {/* Reports & Compliance: Manager & Admin */}
        <Route
          path="reports"
          element={
            <RoleRoute allowedRoles={['Admin', 'Manager']}>
              <ReportsPage />
            </RoleRoute>
          }
        />

        {/* Machine Fleet: Admin only */}
        <Route
          path="machines"
          element={
            <RoleRoute allowedRoles={['Admin']}>
              <MachinesPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
