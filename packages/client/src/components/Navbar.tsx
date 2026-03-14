import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold">
              {t('app.title')}
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/catalog" className="hover:text-indigo-200">
                  {t('nav.catalog')}
                </Link>
                <Link to="/dashboard" className="hover:text-indigo-200">
                  {t('nav.dashboard')}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hover:text-indigo-200">
                    {t('nav.admin')}
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {isAuthenticated ? (
              <>
                <span className="text-sm">{t('nav.hello', { name: user?.name })}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 hover:text-indigo-200"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
