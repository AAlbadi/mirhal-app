import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

const AuthButton: React.FC = () => {
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {currentUser.photoURL && (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || ''}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
          )}
          <span className="text-sm font-semibold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
            {currentUser.displayName || currentUser.email}
          </span>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-white text-brand-orange rounded-lg hover:bg-brand-sand transition font-semibold shadow-md"
        >
          {t('signOut')}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-1.5 sm:gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-2.5 bg-white/10 text-white border-2 border-white rounded-lg active:bg-white active:text-brand-orange sm:hover:bg-white sm:hover:text-brand-orange active:scale-95 transition font-semibold backdrop-blur-sm text-sm sm:text-base"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
        >
          {t('signIn')}
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-2.5 bg-white text-brand-orange rounded-lg active:bg-brand-sand sm:hover:bg-brand-sand active:scale-95 transition font-semibold shadow-md text-sm sm:text-base"
        >
          {t('signUp')}
        </button>
      </div>

      {/* Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-brown-dark">
                {t('welcomeToBrand')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 active:text-gray-900 text-2xl sm:text-3xl w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 active:scale-95 transition-all"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mb-3 sm:mb-4 px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-gray-300 rounded-xl active:border-brand-orange active:shadow-lg sm:hover:border-brand-orange sm:hover:shadow-lg active:scale-95 transition-all font-semibold flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? t('signingIn') : t('continueWithGoogle')}
            </button>

            <div className="text-center text-gray-500 text-xs sm:text-sm">
              {t('authAgreement')}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthButton;
