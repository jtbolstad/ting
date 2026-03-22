import { useTranslation } from "react-i18next";

interface CatalogSearchBarProps {
  defaultValue?: string;
  onSearch: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function CatalogSearchBar({
  defaultValue = "",
  onSearch,
}: CatalogSearchBarProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSearch}>
      <div className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={defaultValue}
          placeholder={t("catalog.searchPlaceholder")}
          className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {t("catalog.search")}
        </button>
      </div>
    </form>
  );
}
