import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await apiClient.requestResetPassword(email);
      setMessage(result.message);
      setEmail('');
    } catch (err: any) {
      setError(err.message || t('auth.forgotPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6">
          {t('auth.forgotPassword.title')}
        </h2>

        <p className="text-sm text-gray-600 mb-4 text-center">
          {t('auth.forgotPassword.description')}
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.forgotPassword.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.submit')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
            {t('auth.forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
