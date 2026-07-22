import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Store, Smartphone, MessageCircle, Zap, ShoppingBag, Search } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, userData } = useAuth();

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: t('features.easy'),
      description: t('features.easy.desc')
    },
    {
      icon: <Smartphone className="h-8 w-8 text-blue-600" />,
      title: t('features.mobile'),
      description: t('features.mobile.desc')
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-blue-600" />,
      title: t('features.whatsapp'),
      description: t('features.whatsapp.desc')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Store className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {!user && (
              <Link
                to="/signup"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                {t('hero.cta')}
              </Link>
            )}
            {user && user.email !== 'dukkani2026@gmail.com' && (
              <Link
                to="/dashboard"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                {i18n.language === 'ar' ? 'انتقل إلى لوحة التحكم' : 'Go to Dashboard'}
              </Link>
            )}
            {user && user.email === 'dukkani2026@gmail.com' && (
              <Link
                to="/dashboard"
                className="inline-block bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
              >
                {i18n.language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}
              </Link>
            )}
            <Link
              to="/marketplace"
              className="inline-flex items-center space-x-2 space-x-reverse bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg border border-blue-600"
            >
              <ShoppingBag size={24} />
              <span>{i18n.language === 'ar' ? 'تصفح السوق' : 'Browse Marketplace'}</span>
            </Link>
          </div>

          {/* Quick Search */}
          <div className="max-w-md mx-auto">
            <Link 
              to="/marketplace"
              className="flex items-center space-x-3 space-x-reverse bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border"
            >
              <Search className="h-5 w-5 text-gray-400" />
              <span className="text-gray-500 flex-1 text-right">
                {i18n.language === 'ar' ? 'ابحث عن المنتجات...' : 'Search for products...'}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('features.title')}
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Marketplace Preview Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-blue-600 mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {i18n.language === 'ar' ? 'اكتشف منتجات مذهلة' : 'Discover Amazing Products'}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {i18n.language === 'ar' 
              ? 'تصفح آلاف المنتجات من متاجر ليبية مختلفة في مكان واحد'
              : 'Browse thousands of products from various Libyan shops in one place'
            }
          </p>
          <Link
            to="/marketplace"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            {i18n.language === 'ar' ? 'استكشف السوق' : 'Explore Marketplace'}
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {i18n.language === 'ar' ? 'ابدأ رحلتك التجارية اليوم' : 'Start Your Business Journey Today'}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {i18n.language === 'ar' 
              ? 'انضم إلى آلاف التجار الذين يثقون بدكاني'
              : 'Join thousands of merchants who trust Dukkani'
            }
          </p>
          {!user && (
            <Link
              to="/signup"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
            >
              {t('hero.cta')}
            </Link>
          )}
          {user && user.email !== 'dukkani2026@gmail.com' && (
            <Link
              to="/dashboard"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
            >
              {i18n.language === 'ar' ? 'انتقل إلى لوحة التحكم' : 'Go to Dashboard'}
            </Link>
          )}
          {user && user.email === 'dukkani2026@gmail.com' && (
            <Link
              to="/dashboard"
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
            >
              {i18n.language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;