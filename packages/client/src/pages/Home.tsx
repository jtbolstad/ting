import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export function Home() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-indigo-600 text-white py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("home.hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-8">
            {t("home.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalog"
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              {t("home.hero.browseCatalog")}
            </Link>
            {!isAuthenticated && (
              <>
                <Link
                  to="/register"
                  className="px-8 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition-colors border border-indigo-400"
                >
                  {t("home.hero.joinFree")}
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 text-indigo-100 hover:text-white underline self-center text-sm"
                >
                  {t("home.hero.login")}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {t("home.howItWorks.title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {(["step1", "step2", "step3"] as const).map((step, i) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t(`home.howItWorks.${step}.title`)}
                </h3>
                <p className="text-gray-600">
                  {t(`home.howItWorks.${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            {t("home.about.title")}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {t("home.about.description")}
          </p>
        </div>
      </section>

      {/* CTA (unauthenticated only) */}
      {!isAuthenticated && (
        <section className="py-16 px-4 bg-indigo-50">
          <div className="container mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              {t("home.cta.title")}
            </h2>
            <p className="text-gray-600 mb-8">{t("home.cta.description")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {t("home.cta.register")}
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {t("home.cta.login")}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
