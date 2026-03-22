import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";

export function OrganizationSwitcher({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const {
    organizations,
    activeOrganizationId,
    setActiveOrganizationId,
    isLoading,
  } = useOrganization();
  const { memberships } = useAuth();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextId = event.target.value || null;
      setActiveOrganizationId(nextId);
    },
    [setActiveOrganizationId],
  );

  const membershipOrgIds = new Set(
    memberships.map((membership) => membership.organizationId),
  );

  const isLight = variant === 'light';

  return (
    <div className={`flex flex-col ${isLight ? 'text-gray-700' : 'text-white'}`}>
      <label
        className={`text-xs uppercase tracking-wide mb-1 ${isLight ? 'text-gray-500' : 'opacity-70'}`}
        htmlFor="org-switcher"
      >
        Organization
      </label>
      <select
        id="org-switcher"
        className={isLight
          ? "border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          : "bg-indigo-500/50 border border-indigo-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/70"
        }
        value={activeOrganizationId ?? ""}
        onChange={handleChange}
        disabled={isLoading || organizations.length === 0}
      >
        {organizations.map((organization) => {
          const hasMembership = membershipOrgIds.has(organization.id);
          const label = hasMembership
            ? organization.name
            : `${organization.name} (public)`;
          return (
            <option key={organization.id} value={organization.id}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
