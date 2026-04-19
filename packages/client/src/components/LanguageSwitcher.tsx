import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";

const FlagIcon = ({ code }: { code: string }) => {
  const flags: Record<string, string> = {
    en: "https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg",
    no: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Flag_of_Norway.svg",
    da: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Flag_of_Denmark.svg",
  };

  return flags[code] ? (
    <img
      src={flags[code]}
      alt={code}
      className="w-6 h-4 rounded-sm"
      loading="lazy"
    />
  ) : null;
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "no", name: "Norsk" },
    { code: "da", name: "Dansk" },
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
        className="flex items-center px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
        title={currentLanguage.name}
        aria-label={`Change language (current: ${currentLanguage.name})`}
        aria-expanded={isOpen}
      >
        <FlagIcon code={currentLanguage.code} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg z-50 border border-gray-200 p-2 flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`p-2 rounded transition-all ${
                i18n.language === lang.code
                  ? "bg-indigo-100 ring-2 ring-indigo-600"
                  : "hover:bg-gray-100"
              }`}
              title={lang.name}
              aria-label={`Switch to ${lang.name}`}
              aria-current={i18n.language === lang.code ? "true" : "false"}
            >
              <FlagIcon code={lang.code} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
