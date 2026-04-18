-- Backfill slugs for items created before slug generation was added.
-- Approximates the server's toSlug: lowercase, spaces→dashes, append last 6 chars of id.
UPDATE "Item"
SET "slug" = lower(replace(replace(replace(trim("name"), ' ', '-'), '_', '-'), '--', '-')) || '-' || substr("id", -6)
WHERE "slug" IS NULL;
