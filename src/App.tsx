import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout, removeAuthToken, User } from './utils/api';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Layout from './components/Layout';
import DashboardHome from './components/DashboardHome';
import Couriers from './components/Couriers';
import Users from './components/Users';
import Vendor from './components/Vendor';
import SuspendedUsers from './components/SuspendedUsers';
import Orders from './components/Orders';
import VerificationRequest from './components/VerificationRequest';
import VerificationDashboard from './components/VerificationDashboard';
import VerificationDetails from './components/VerificationDetails';
import VerificationDetailsNew from './components/VerificationDetailsNew';
import './App.css';
// ...existing code...
import Analytics from './components/Analytics';
import Profit from './components/Profit';
import Login from './components/Login';
import Settings from './components/Settings';
import './App.css';

// A simple wrapper to handle protected routes
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = isAuthenticated();
      setAuthStatus(isAuth);
      
      if (!isAuth) {
        navigate('/login', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  if (authStatus === null) {
    return <div className="loading">Loading...</div>;
  }

  return <>{children}</>;
};

// A wrapper to redirect authenticated users away from auth pages
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = isAuthenticated();
      setAuthStatus(isAuth);
      
      if (isAuth) {
        navigate('/dashboard', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  if (authStatus === null) {
    return <div className="loading">Loading...</div>;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const handleLogout = async () => {
    try {
      await logout();
      removeAuthToken();
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  return (
    <WebSocketProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login onLoginSuccess={handleLoginSuccess} />
              </PublicRoute>
            }
          />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout onLogout={handleLogout} />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="couriers" element={<Couriers />} />
            <Route path="users" element={<Users />} />
            <Route path="vendors" element={<Vendor />} />
            <Route path="suspended-users" element={<SuspendedUsers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="verification-requests" element={<VerificationDashboard />} />
            <Route path="verification-requests-old" element={<VerificationRequest />} />
            <Route path="verification-requests/:id" element={<VerificationDetailsNew />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profit" element={<Profit />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </WebSocketProvider>
  );
};

export default App;
