import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";

export function OrganizationSwitcher() {
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

  return (
    <div className="flex flex-col text-white">
      <label
        className="text-xs uppercase tracking-wide opacity-70 mb-1"
        htmlFor="org-switcher"
      >
        Organization
      </label>
      <select
        id="org-switcher"
        className="bg-indigo-500/50 border border-indigo-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/70"
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
