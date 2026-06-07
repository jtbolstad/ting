import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Home() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-orange-800 text-white py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-orange-200 text-sm font-semibold uppercase tracking-widest mb-3">
            1{t("home.hero.byline")}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            2{t("home.hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            3{t("home.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalog"
              className="px-8 py-3 bg-white text-orange-800 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
            >
              {t("home.hero.browseCatalog")}
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-8 py-3 bg-orange-700 text-white font-semibold rounded-lg hover:bg-orange-900 transition-colors border border-orange-500"
              >
                {t("home.hero.login")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Members only notice */}
      <section className="bg-orange-50 border-b border-orange-200 py-4 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-orange-800 text-sm balance">
            {t("home.membersOnly.notice")}
            <a
              href="https://hpvel.no"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:text-orange-900"
            >
              hpvel.no
            </a>
          </p>
        </div>
      </section>

      {/* What's available */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">
            {t("home.available.title")}
          </h2>
          <p className="text-center text-gray-500 mb-10">{t("home.available.subtitle")}</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(["tents", "speakers", "smoke", "projector"] as const).map((item) => (
              <div
                key={item}
                className="bg-white rounded-lg p-5 text-center shadow-sm border border-stone-200"
              >
                <div className="text-3xl mb-2">{t(`home.available.items.${item}.icon`)}</div>
                <div className="font-semibold text-gray-800">{t(`home.available.items.${item}.name`)}</div>
                <div className="text-sm text-gray-500 mt-1">{t(`home.available.items.${item}.detail`)}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/catalog"
              className="inline-block px-6 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors font-medium"
            >
              {t("home.available.viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {t("home.howItWorks.title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {(["step1", "step2", "step3"] as const).map((step, i) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-orange-700 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
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

      {/* Lend your own + request tips */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-200">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t("home.lendOut.title")}</h3>
            <p className="text-gray-600">{t("home.lendOut.description")}</p>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-200">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t("home.requestTip.title")}</h3>
            <p className="text-gray-600">{t("home.requestTip.description")}</p>
          </div>
        </div>
      </section>

      {/* About HPV */}
      <section className="bg-orange-800 text-white py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t("home.about.title")}</h2>
          <p className="text-orange-100 text-lg leading-relaxed mb-6">
            {t("home.about.description")}
          </p>
          <a
            href="https://hpvel.no/2026/04/15/det-du-trenger-uten-a-eie/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-white text-orange-800 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
          >
            {t("home.about.readMore")}
          </a>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-16 px-4 bg-stone-100">
          <div className="container mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              {t("home.cta.title")}
            </h2>
            <p className="text-gray-600 mb-8">{t("home.cta.description")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-orange-700 text-white font-semibold rounded-lg hover:bg-orange-800 transition-colors"
              >
                {t("home.cta.register")}
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border border-orange-700 text-orange-700 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
              >
                {t("home.cta.login")}
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              {t("home.cta.notMember")}{" "}
              <a
                href="https://hpvel.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-700 underline hover:text-orange-900"
              >
                hpvel.no
              </a>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
