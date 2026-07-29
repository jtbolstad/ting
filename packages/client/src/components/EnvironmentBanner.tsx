const APP_ENV = import.meta.env.VITE_APP_ENV;

/**
 * Marks non-production deployments so testers never mistake staging for the
 * live site. Deliberately untranslated — this is an internal marker, and it
 * should look the same whatever language the tester has selected.
 */
export function EnvironmentBanner() {
  if (APP_ENV !== "staging") return null;

  return (
    <div
      role="status"
      className="bg-amber-500 text-amber-950 text-center text-xs font-semibold tracking-wide px-4 py-1"
    >
      STAGING — test data, not the live site
      {import.meta.env.VITE_BUILD_TIME ? ` · built ${import.meta.env.VITE_BUILD_TIME}` : ""}
    </div>
  );
}
