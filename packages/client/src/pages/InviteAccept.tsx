import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui/Spinner";

export function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }

    acceptInvitation();
  }, [token, isAuthenticated]);

  const acceptInvitation = async () => {
    if (!token) return;
    try {
      const result = await apiClient.acceptInvitation(token);
      setOrgName(result.organization.name);
      await refreshUser();
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || t("invite.acceptFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">✗</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("invite.error")}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {t("invite.goHome")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t("invite.success")}
        </h2>
        <p className="text-gray-600 mb-2">
          {t("invite.joinedOrg", { orgName })}
        </p>
        <p className="text-sm text-gray-500">
          {t("invite.redirecting")}
        </p>
      </div>
    </div>
  );
}
