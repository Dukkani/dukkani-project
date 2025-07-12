import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CreditCard, Check, AlertCircle } from 'lucide-react';

const SubscriptionPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user subscription status
      await updateDoc(doc(db, 'users', user.uid), {
        subscription: {
          status: 'active',
          planId: 'monthly_25_lyd',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          sadadTransactionId: `SADAD_${Date.now()}`,
          lastPayment: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      await refreshUserData();
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Payment error:', err);
      setError(t('subscription.error', 'Payment processing failed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('subscription.success', 'Subscription activated successfully')}
          </h2>
          <p className="text-gray-600 mb-6">
            {i18n.language === 'ar' 
              ? 'تم تفعيل اشتراكك بنجاح! جاري التحويل إلى لوحة التحكم...'
              : 'Your subscription has been activated successfully! Redirecting to dashboard...'
            }
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('subscription.title', 'Monthly Subscription')}
          </h1>
          <p className="text-lg text-gray-600">
            {i18n.language === 'ar' 
              ? 'اشترك الآن للحصول على جميع مميزات دكاني'
              : 'Subscribe now to get all Dukkani features'
            }
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
            <div className="text-4xl font-bold mb-2">
              {t('subscription.price', '25 LYD/Month')}
            </div>
            <p className="text-blue-100">
              {i18n.language === 'ar' ? 'اشتراك شهري' : 'Monthly subscription'}
            </p>
          </div>

          <div className="px-6 py-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {t('subscription.features', 'Subscription Features')}
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Check className="h-5 w-5 text-green-600" />
                <span>{t('subscription.feature.shop', 'Complete online store')}</span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Check className="h-5 w-5 text-green-600" />
                <span>{t('subscription.feature.products', 'Unlimited products')}</span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Check className="h-5 w-5 text-green-600" />
                <span>{t('subscription.feature.whatsapp', 'WhatsApp integration')}</span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Check className="h-5 w-5 text-green-600" />
                <span>{t('subscription.feature.support', '24/7 technical support')}</span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Check className="h-5 w-5 text-green-600" />
                <span>{i18n.language === 'ar' ? 'رفع صور المنتجات' : 'Product image uploads'}</span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Check className="h-5 w-5 text-green-600" />
                <span>{i18n.language === 'ar' ? 'شعار وبانر المتجر' : 'Shop logo and banner'}</span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Check className="h-5 w-5 text-green-600" />
                <span>{i18n.language === 'ar' ? 'روابط وسائل التواصل الاجتماعي' : 'Social media links'}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3 space-x-reverse">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>{i18n.language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  <span>{t('subscription.pay', 'Pay Now')}</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                {i18n.language === 'ar' 
                  ? 'الدفع آمن ومحمي. يمكنك إلغاء الاشتراك في أي وقت.'
                  : 'Secure payment. You can cancel your subscription anytime.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {i18n.language === 'ar' 
              ? 'لديك أسئلة؟ تواصل معنا عبر الدعم الفني'
              : 'Have questions? Contact our support team'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;