import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const STORAGE_KEY = "ting_welcome_dismissed";

export function WelcomeBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(STORAGE_KEY));

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="bg-indigo-600 text-white">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold">{t("welcome.title")}</p>
          <p className="text-indigo-200 text-sm mt-0.5">{t("welcome.subtitle")}</p>
        </div>
        <div className="flex gap-3 items-center flex-shrink-0">
          <Link
            to="/catalog"
            onClick={handleDismiss}
            className="px-3 py-1.5 bg-white text-indigo-700 rounded text-sm font-medium hover:bg-indigo-50"
          >
            {t("welcome.browseCatalog")}
          </Link>
          <button
            onClick={handleDismiss}
            className="text-indigo-200 hover:text-white text-sm"
          >
            {t("welcome.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
