import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import LandingPage from './pages/LandingPage';
import MarketplacePage from './pages/MarketplacePage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import SubscriptionPage from './pages/SubscriptionPage';
import DashboardPage from './pages/DashboardPage';
import ShopPage from './pages/ShopPage';
import SupportPage from './pages/SupportPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set RTL direction for Arabic
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Header />
          <Routes>
            {/* Redirect root to marketplace for better UX */}
            <Route path="/" element={<Navigate to="/marketplace" replace />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/shop/:shopUrlSlug" element={<ShopPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;