import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

interface TermsPopoverProps {
  id: string;
}

export function TermsPopover({ id }: TermsPopoverProps) {
  const { i18n, t } = useTranslation();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTerms();
  }, [i18n.language]);

  const loadTerms = async () => {
    setLoading(true);
    try {
      const lang = i18n.language || "en";
      const response = await fetch(`/terms/terms-${lang}.md`);
      if (!response.ok) {
        const fallbackResponse = await fetch("/terms/terms-en.md");
        const text = await fallbackResponse.text();
        setContent(text);
      } else {
        const text = await response.text();
        setContent(text);
      }
    } catch (error) {
      console.error("Failed to load terms:", error);
      setContent("Failed to load terms of service.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    popoverRef.current?.hidePopover();
  };

  return (
    <>
      <style>{`
        #${id}::backdrop {
          background-color: rgba(0, 0, 0, 0.7);
        }
      `}</style>
      <div
        ref={popoverRef}
        // @ts-ignore - popover is not yet in TypeScript types
        popover="auto"
        id={id}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          margin: 0,
        }}
        className="p-0 border-0 max-w-4xl w-[90vw] max-h-[85vh] overflow-auto bg-white rounded-lg shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">{t("auth.register.termsLink")}</h2>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              {t("common.loading")}
            </div>
          ) : (
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </>
  );
}
