import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(
        errorParam === 'oauth_not_configured'
          ? t('auth.oauth.notConfigured')
          : errorParam === 'oauth_failed'
          ? t('auth.oauth.failed')
          : t('auth.oauth.genericError')
      );
      return;
    }

    if (token) {
      // Store the token (same as regular login)
      localStorage.setItem('token', token);
      // Full reload rather than navigate(): AuthProvider only reads the token
      // from localStorage when it mounts, so a client-side transition would
      // land on /catalog still logged out.
      window.location.replace('/catalog');
    } else {
      setError(t('auth.oauth.noToken'));
    }
  }, [searchParams, navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">{t('auth.oauth.errorTitle')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-orange-700 text-white rounded hover:bg-orange-800"
          >
            {t('auth.oauth.backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-700 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('auth.oauth.processing')}</p>
      </div>
    </div>
  );
}
