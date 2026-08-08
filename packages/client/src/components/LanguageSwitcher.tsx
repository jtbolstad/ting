import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";

// Map language code to ISO 3166-1 alpha-2 country code for local flag images
const LANG_TO_COUNTRY: Record<string, string> = {
  en: "gb",
  no: "no",
  da: "dk",
  es: "es",
  pl: "pl",
  ur: "pk",
};

const FlagIcon = ({ code }: { code: string }) => {
  const country = LANG_TO_COUNTRY[code];
  if (!country) return null;
  return (
    <img
      src={`/flags/${country}.png`}
      width={40}
      height={30}
      alt={code}
      className="rounded-sm inline-block w-6 h-auto"
    />
  );
};

export function LanguageSwitcher({ align = "right" }: { align?: "left" | "right" }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "no", name: "Norsk" },
    { code: "da", name: "Dansk" },
    { code: "es", name: "Español" },
    { code: "pl", name: "Polski" },
    { code: "ur", name: "اردو" },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-2 py-1 rounded hover:bg-orange-800 transition-colors"
        title={currentLanguage.name}
        aria-label={`Change language (current: ${currentLanguage.name})`}
        aria-expanded={isOpen}
      >
        <FlagIcon code={currentLanguage.code} />
      </button>

      {isOpen && (
        <div className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 bg-white rounded-md shadow-lg z-50 border border-gray-200 w-40`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors first:rounded-t-md last:rounded-b-md ${
                i18n.language === lang.code
                  ? "bg-orange-100 text-orange-800 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
              aria-label={`Switch to ${lang.name}`}
              aria-current={i18n.language === lang.code ? "true" : "false"}
            >
              <FlagIcon code={lang.code} />
              <span>{lang.name}</span>
              {i18n.language === lang.code && (
                <svg className="w-4 h-4 ml-auto text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
