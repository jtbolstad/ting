#!/usr/bin/env bash
#
# refresh-stage-db.sh — rebuild the stage database from production.
#
# Runs ON THE VPS, as the deploy user. Not part of any deploy workflow; run it
# by hand when stage needs fresh data.
#
#   sudo -u deploy /var/www/ting-stage/scripts/refresh-stage-db.sh
#
# What it does:
#   1. Takes a consistent snapshot of the production SQLite database
#   2. Pseudonymizes personal data in the snapshot (never touches prod)
#   3. Stops ting-stage, swaps the file in, starts it again
#
# PRIVACY: the result is PSEUDONYMIZED, NOT ANONYMOUS. Emails, names, comments
# and email logs are replaced, but real reservation and loan history,
# organization names, locations and item catalogues survive intact — and those
# can identify people by inference. Treat stage access as internal-only.
#
# Env overrides:
#   PROD_DB           default /var/data/db.sqlite
#   STAGE_DB        default /var/data/stage/db.sqlite
#   STAGE_PASSWORD  default "stage123" — password every stage user gets
#   SYNC_UPLOADS      set to 1 to also rsync production uploads into stage

set -euo pipefail

PROD_DB="${PROD_DB:-/var/data/db.sqlite}"
STAGE_DB="${STAGE_DB:-/var/data/stage/db.sqlite}"
STAGE_PASSWORD="${STAGE_PASSWORD:-stage123}"
PROD_UPLOADS="${PROD_UPLOADS:-/var/data/uploads}"
STAGE_UPLOADS="${STAGE_UPLOADS:-/var/data/stage/uploads}"
REPO_DIR="${REPO_DIR:-/var/www/ting-stage}"

TMP_DB="$(mktemp /tmp/stage-refresh.XXXXXX.sqlite)"
trap 'rm -f "$TMP_DB" "$TMP_DB"-wal "$TMP_DB"-shm' EXIT

command -v sqlite3 >/dev/null || { echo "sqlite3 not installed (apt install sqlite3)" >&2; exit 1; }
command -v pm2 >/dev/null     || { echo "pm2 not on PATH" >&2; exit 1; }
[ -f "$PROD_DB" ]             || { echo "production database not found: $PROD_DB" >&2; exit 1; }

# Refuse to run if the two paths are the same — that would anonymize production.
if [ "$(readlink -f "$PROD_DB")" = "$(readlink -f "$STAGE_DB")" ]; then
  echo "PROD_DB and STAGE_DB resolve to the same file. Aborting." >&2
  exit 1
fi

echo "==> Snapshotting $PROD_DB"
# .backup rather than cp: prod is live and may have a WAL, so a plain copy can
# capture a torn database. .backup uses SQLite's online backup API.
sqlite3 "$PROD_DB" ".backup '$TMP_DB'"

echo "==> Generating bcrypt hash for the shared stage password"
# Reuse the app's own bcryptjs so the cost factor matches what the server expects.
HASH="$(cd "$REPO_DIR/packages/server" && node -e '
  const bcrypt = require("bcryptjs");
  process.stdout.write(bcrypt.hashSync(process.argv[1], 10));
' "$STAGE_PASSWORD")"
[ -n "$HASH" ] || { echo "failed to generate password hash" >&2; exit 1; }

echo "==> Pseudonymizing snapshot"
sqlite3 "$TMP_DB" <<SQL
PRAGMA foreign_keys = ON;
BEGIN;

-- .invalid is reserved by RFC 2606 and can never resolve, so even a
-- misconfigured SMTP on stage cannot reach a real inbox.
UPDATE "User" SET
  email                  = 'user' || rowid || '@stage.invalid',
  name                   = 'Test User ' || rowid,
  passwordHash           = '$HASH',
  resetPasswordToken     = NULL,
  resetPasswordExpiresAt = NULL;

-- Keep one predictable admin login for testers. The platform admin role is
-- 'ADMIN' (see requireAdmin in packages/server/src/middleware/auth.ts) —
-- the "SUPERADMIN" in the schema comment is not a value the code ever checks.
UPDATE "User" SET email = 'admin@stage.invalid'
WHERE id = (SELECT id FROM "User" WHERE role = 'ADMIN' ORDER BY createdAt LIMIT 1);

UPDATE "OrganizationInvitation" SET
  email = 'invite' || rowid || '@stage.invalid',
  token = lower(hex(randomblob(16)));

-- Every row is a real recipient address; nothing here is worth keeping.
DELETE FROM "EmailLog";

-- Free text that can quote user data.
UPDATE "AuditLog" SET description = NULL, metadata = NULL;
UPDATE "Comment"  SET content = 'Anonymized comment.';
UPDATE "Review"   SET comment = NULL;

COMMIT;
SQL

sqlite3 "$TMP_DB" "VACUUM;"

echo "==> Verifying an admin login exists"
ADMINS="$(sqlite3 "$TMP_DB" "SELECT COUNT(*) FROM \"User\" WHERE email = 'admin@stage.invalid';")"
if [ "$ADMINS" != "1" ]; then
  echo "Expected exactly 1 admin@stage.invalid, found $ADMINS." >&2
  echo "Production has no User with role='ADMIN' — testers would have no admin login." >&2
  exit 1
fi

echo "==> Verifying no production addresses survived"
LEAKED="$(sqlite3 "$TMP_DB" "
  SELECT (SELECT COUNT(*) FROM \"User\" WHERE email NOT LIKE '%@stage.invalid')
       + (SELECT COUNT(*) FROM \"OrganizationInvitation\" WHERE email NOT LIKE '%@stage.invalid')
       + (SELECT COUNT(*) FROM \"EmailLog\");
")"
if [ "$LEAKED" != "0" ]; then
  echo "Refusing to install: $LEAKED row(s) still hold production addresses." >&2
  exit 1
fi

echo "==> Installing into $STAGE_DB"
mkdir -p "$(dirname "$STAGE_DB")"
pm2 stop ting-stage >/dev/null 2>&1 || echo "    (ting-stage was not running)"
if [ -f "$STAGE_DB" ]; then
  mv "$STAGE_DB" "$STAGE_DB.bak.$(date +%Y%m%d_%H%M%S)"
fi
# Clear any stale WAL/SHM from the previous stage database.
rm -f "$STAGE_DB"-wal "$STAGE_DB"-shm
cp "$TMP_DB" "$STAGE_DB"
chmod 640 "$STAGE_DB"

if [ "${SYNC_UPLOADS:-0}" = "1" ]; then
  echo "==> Syncing uploads (item photos — not personal data)"
  mkdir -p "$STAGE_UPLOADS"
  rsync -a --delete "$PROD_UPLOADS/" "$STAGE_UPLOADS/"
fi

pm2 start ting-stage >/dev/null

echo
echo "Stage data refreshed."
echo "  Login: admin@stage.invalid / $STAGE_PASSWORD"
echo "  All other users: userN@stage.invalid / $STAGE_PASSWORD"
