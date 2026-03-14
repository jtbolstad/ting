import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold">
              Ting
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/catalog" className="hover:text-indigo-200">
                  Catalog
                </Link>
                <Link to="/dashboard" className="hover:text-indigo-200">
                  My Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hover:text-indigo-200">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm">Hello, {user?.name}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 hover:text-indigo-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
