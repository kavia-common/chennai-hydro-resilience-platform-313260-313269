import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import useUIStore from './store/useUIStore';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import ZoneExplorer from './pages/ZoneExplorer';
import Reports from './pages/Reports';
import Loader from './components/common/Loader';
import './App.css';

// PUBLIC_INTERFACE
/**
 * PrivateRoute wrapper to protect authenticated routes.
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader size="large" text="Loading..." />;
  }

  return user ? children : <Navigate to="/login" />;
};

// PUBLIC_INTERFACE
/**
 * AppLayout component with Header and Sidebar for authenticated pages.
 */
const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
};

// PUBLIC_INTERFACE
/**
 * Main App component with routing and theme management.
 * Entry point for the CHRIS application.
 */
function App() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    // Apply theme on mount
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, [setTheme]);

  return (
    <AuthProvider>
      <Router>
        <div className="App" data-theme={theme}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/forecast"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Forecast />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/zone-explorer"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <ZoneExplorer />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
