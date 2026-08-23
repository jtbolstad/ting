import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { TermsPopover } from "../components/TermsPopover";
import { MembershipNotice } from "../components/MembershipNotice";
import { apiClient } from "../api/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export function Register() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteOrgName, setInviteOrgName] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (inviteToken) {
      loadInvitation();
    }
  }, [inviteToken]);

  useEffect(() => {
    // Only show the Google button when the server has OAuth credentials.
    fetch(`${API_BASE_URL}/auth/status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => setGoogleEnabled(Boolean(body?.data?.google)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  const loadInvitation = async () => {
    try {
      const invitation = await apiClient.getInvitation(inviteToken!);
      setEmail(invitation.email);
      setInviteOrgName(invitation.organizationName);
    } catch (err: any) {
      setError(err.message || "Invalid invitation");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError(t("auth.register.termsRequired"));
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name, null);

      // If registering via invite, accept invitation after registration
      if (inviteToken) {
        try {
          await apiClient.acceptInvitation(inviteToken);
        } catch (inviteErr) {
          console.error("Failed to accept invitation:", inviteErr);
        }
      }

      navigate("/catalog");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6">
          {t("auth.register.title")}
        </h2>

        <MembershipNotice />

        {inviteOrgName && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded">
            Invitert til <strong>{inviteOrgName}</strong>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("auth.register.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("auth.register.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!inviteToken}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("auth.register.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
              className="mt-1 mr-2"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700">
              {t("auth.register.acceptTerms")}{" "}
              <button
                type="button"
                // @ts-ignore - popovertarget is not yet in TypeScript types
                popovertarget="terms-popover"
                className="text-orange-500 hover:text-orange-700 underline"
              >
                {t("auth.register.termsLink")}
              </button>
            </label>
          </div>

          <TermsPopover id="terms-popover" />

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full py-2 px-4 bg-orange-700 text-white rounded hover:bg-orange-800 disabled:bg-gray-400"
          >
            {loading
              ? t("auth.register.registering")
              : t("auth.register.submit")}
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs uppercase text-gray-500">{t("auth.oauth.or")}</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <a
              href={`${API_BASE_URL}/auth/google`}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M21.6 12.23c0-.7-.06-1.37-.18-2.02H12v3.82h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.98-4.3 2.98-7.32Z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.23-2.5c-.9.6-2.05.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H3.07v2.58A10 10 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.41 13.91a6 6 0 0 1 0-3.82V7.51H3.07a10 10 0 0 0 0 8.98l3.34-2.58Z" />
                <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.93 5.51l3.34 2.58C7.2 7.73 9.4 5.98 12 5.98Z" />
              </svg>
              {t("auth.oauth.signInWithGoogle")}
            </a>
          </>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          {t("auth.register.hasAccount")}{" "}
          <Link to="/login" className="text-orange-500 hover:text-orange-700">
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
