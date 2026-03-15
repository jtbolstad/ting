import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { organizations, activeOrganizationId, isLoading: organizationsLoading } = useOrganization();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!organizationId && activeOrganizationId) {
      setOrganizationId(activeOrganizationId);
    }
  }, [activeOrganizationId, organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!organizationId) {
      setError('Please select an organization to join');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name, organizationId);
      navigate('/catalog');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6">{t('auth.register.title')}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.register.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.register.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.register.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <select
              value={organizationId ?? ''}
              onChange={(e) => setOrganizationId(e.target.value || null)}
              required
              disabled={organizationsLoading || organizations.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>
                {organizationsLoading ? 'Loading organizations...' : 'Select an organization'}
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || organizationsLoading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? t('auth.register.registering') : t('auth.register.submit')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
            {t('auth.register.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
