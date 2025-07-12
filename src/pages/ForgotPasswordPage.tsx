import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Handle specific Firebase errors
      switch (err.code) {
        case 'auth/user-not-found':
          setError(t('auth.error.user.not.found', 'No account found with this email address'));
          break;
        case 'auth/invalid-email':
          setError(t('auth.error.invalid.email', 'Please enter a valid email address'));
          break;
        case 'auth/too-many-requests':
          setError(t('auth.error.too.many.requests', 'Too many requests. Please try again later'));
          break;
        default:
          setError(t('auth.reset.error', 'Error sending password reset link. Please try again'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('auth.reset.success.title', 'Email Sent!')}
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {t('auth.reset.success.message', 'Success! If an account exists for this email, a password reset link has been sent.')}
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t('auth.reset.check.spam', 'Please check your spam folder if you don\'t see the email in your inbox.')}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 space-x-reverse text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('auth.back.to.login', 'Back to Login')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth.forgot.password.title', 'Forgot Your Password?')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('auth.forgot.password.subtitle', 'Enter your email address and we\'ll send you a link to reset your password.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 space-x-reverse">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email', 'Email Address')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder-gray-400"
                  placeholder={t('auth.email.placeholder', 'Enter your email address')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  {t('loading', 'Loading...')}
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  {t('auth.send.reset.link', 'Send Password Reset Link')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 space-x-reverse text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('auth.back.to.login', 'Back to Login')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;