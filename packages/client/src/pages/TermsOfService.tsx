import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

export function TermsOfService() {
  const { i18n } = useTranslation();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTerms();
  }, [i18n.language]);

  const loadTerms = async () => {
    setLoading(true);
    try {
      const lang = i18n.language || "en";
      const response = await fetch(`/terms/terms-${lang}.md`);
      if (!response.ok) {
        // Fallback to English if translation not found
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
