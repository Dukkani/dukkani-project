import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Store, LogOut, ShoppingBag, Home, HeadphonesIcon } from 'lucide-react';
import LanguageToggle from './LanguageToggle';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/marketplace');
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/marketplace" className="flex items-center space-x-2 space-x-reverse">
            <Store className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">دكاني</span>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 space-x-reverse">
            <Link
              to="/marketplace"
              className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ShoppingBag size={20} />
              <span>{t('marketplace')}</span>
            </Link>
            <Link
              to="/home"
              className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Home size={20} />
              <span>{i18n.language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <Link
              to="/support"
              className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-blue-600 transition-colors"
            >
              <HeadphonesIcon size={20} />
              <span>{t('support')}</span>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <LanguageToggle />
            
            {user ? (
              <div className="flex items-center space-x-4 space-x-reverse">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  {t('dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut size={20} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 space-x-reverse">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 flex space-x-6 space-x-reverse">
          <Link
            to="/marketplace"
            className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-blue-600 transition-colors"
          >
            <ShoppingBag size={20} />
            <span>{t('marketplace')}</span>
          </Link>
          <Link
            to="/home"
            className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-blue-600 transition-colors"
          >
            <Home size={20} />
            <span>{i18n.language === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </Link>
          <Link
            to="/support"
            className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-blue-600 transition-colors"
          >
            <HeadphonesIcon size={20} />
            <span>{t('support')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;