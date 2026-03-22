import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { TermsPopover } from "./TermsPopover";

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo + desktop nav links */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold" onClick={close}>
              {t("app.title")}
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/catalog" className="hover:text-indigo-200">{t("nav.catalog")}</Link>
                <Link to="/items/add" className="hover:text-indigo-200">{t("nav.addItem")}</Link>
                <Link to="/dashboard" className="hover:text-indigo-200">{t("nav.dashboard")}</Link>
                {isAdmin && (
                  <Link to="/admin" className="hover:text-indigo-200">{t("nav.admin")}</Link>
                )}
              </div>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              type="button"
              // @ts-ignore - popovertarget is not yet in TypeScript types
              popovertarget="navbar-terms-popover"
              className="text-sm hover:text-indigo-200"
            >
              {t("nav.terms")}
            </button>
            <OrganizationSwitcher />
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <span className="text-sm">{t("nav.hello", { name: user?.name })}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 hover:text-indigo-200">{t("nav.login")}</Link>
                <Link to="/register" className="px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800">
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded hover:bg-indigo-700"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-indigo-700 px-4 pb-4 space-y-1">
          {isAuthenticated ? (
            <>
              <Link to="/catalog" onClick={close} className="block py-2 hover:text-indigo-200">{t("nav.catalog")}</Link>
              <Link to="/items/add" onClick={close} className="block py-2 hover:text-indigo-200">{t("nav.addItem")}</Link>
              <Link to="/dashboard" onClick={close} className="block py-2 hover:text-indigo-200">{t("nav.dashboard")}</Link>
              {isAdmin && (
                <Link to="/admin" onClick={close} className="block py-2 hover:text-indigo-200">{t("nav.admin")}</Link>
              )}
              <div className="pt-3 border-t border-indigo-500 flex items-center justify-between">
                <span className="text-sm">{t("nav.hello", { name: user?.name })}</span>
                <button
                  onClick={() => { logout(); close(); }}
                  className="px-4 py-2 bg-indigo-800 rounded hover:bg-indigo-900 text-sm"
                >
                  {t("nav.logout")}
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" onClick={close} className="block py-2 hover:text-indigo-200">{t("nav.login")}</Link>
              <Link to="/register" onClick={close} className="block py-2 hover:text-indigo-200">{t("nav.register")}</Link>
            </>
          )}
          <div className="pt-3 border-t border-indigo-500 flex items-center gap-4">
            <button
              type="button"
              // @ts-ignore
              popovertarget="navbar-terms-popover"
              className="text-sm hover:text-indigo-200"
            >
              {t("nav.terms")}
            </button>
            <OrganizationSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      )}

      <TermsPopover id="navbar-terms-popover" />
    </nav>
  );
}
