import { useTranslation } from "react-i18next";
import type { Organization } from "@ting/shared";

interface CatalogHeaderProps {
  organization: Organization | null;
}

export function CatalogHeader({ organization }: CatalogHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold">{t("catalog.title")}</h1>
      {organization && (
        <p className="text-gray-600 mt-2">{organization.name}</p>
      )}
    </div>
  );
}
