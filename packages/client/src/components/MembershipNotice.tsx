import { useTranslation } from "react-i18next";

/**
 * Reminds visitors on the login/register pages that borrowing requires an
 * active HPV membership. Shown above the form so people don't register or
 * try to log in before realizing membership + dues are handled elsewhere.
 */
export function MembershipNotice() {
  const { t } = useTranslation();

  return (
    <p className="mb-4 text-xs text-gray-500 text-center">
      {t("auth.membershipNotice.text")}{" "}
      {t("auth.membershipNotice.cta")}{" "}
      <a
        href="https://hpvel.no/bli-medlem/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-500 hover:text-orange-700 underline"
      >
        {t("auth.membershipNotice.linkLabel")}
      </a>
    </p>
  );
}
