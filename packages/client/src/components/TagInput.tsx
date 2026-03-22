import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
}

export function TagInput({ tags, onChange, label }: TagInputProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.toLowerCase().trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded focus-within:ring-2 focus-within:ring-indigo-500 bg-white min-h-[42px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-sm rounded"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-500 hover:text-indigo-800 leading-none"
              aria-label={t("tags.remove", { tag })}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input) addTag(input); }}
          className="flex-1 min-w-[120px] outline-none text-sm"
          placeholder={tags.length === 0 ? t("tags.placeholder") : ""}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{t("tags.hint")}</p>
    </div>
  );
}
