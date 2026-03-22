import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { OrganizationSwitcher } from "../components/OrganizationSwitcher";
import { TermsPopover } from "../components/TermsPopover";

export function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>

        {/* User info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-2">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">{t("profile.userInfo")}</h2>
          <div>
            <span className="text-sm text-gray-500">{t("auth.name")}</span>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">{t("auth.email")}</span>
            <p className="font-medium">{user?.email}</p>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{t("profile.organization")}</h2>
          <OrganizationSwitcher variant="light" />
        </div>

        {/* Terms */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">{t("profile.terms")}</h2>
          <button
            type="button"
            // @ts-ignore
            popovertarget="profile-terms-popover"
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            {t("nav.terms")}
          </button>
        </div>
      </div>

      <TermsPopover id="profile-terms-popover" />
    </div>
  );
}
