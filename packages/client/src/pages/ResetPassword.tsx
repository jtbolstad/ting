import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPassword.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.resetPassword.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const result = await apiClient.resetPassword(token, newPassword);
      setMessage(result.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || t('auth.resetPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-4 text-red-600">
            {t('auth.resetPassword.invalidToken')}
          </h2>
          <p className="text-center text-gray-600 mb-4">
            {t('auth.resetPassword.invalidTokenDescription')}
          </p>
          <p className="text-center">
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800">
              {t('auth.resetPassword.requestNew')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6">
          {t('auth.resetPassword.title')}
        </h2>

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
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.resetPassword.newPassword')}
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.resetPassword.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? t('auth.resetPassword.resetting') : t('auth.resetPassword.submit')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
            {t('auth.resetPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
