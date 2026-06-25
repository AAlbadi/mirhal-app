import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import { useAuth0 } from '@auth0/auth0-react';
import { useI18n } from '../contexts/I18nContext';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  const { t } = useI18n();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/auth/verify-email/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setStatus('success');
        setMessage(data.message);

        // Redirect to host dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard/host');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An error occurred during verification');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-brand-sand flex items-center justify-center px-4 pt-48">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-teal mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">{t('verifyingYourEmail')}</h2>
            <p className="text-gray-600">{t('pleaseWait')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">{t('emailVerified')}</h2>
            <p className="text-gray-700 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              {t('redirectingToDashboard')}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✕</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">{t('verificationFailed')}</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-opacity-90 transition"
              >
                {t('goHome')}
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/become-host')}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  {t('requestNewVerification')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
