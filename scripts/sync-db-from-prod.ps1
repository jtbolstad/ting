# sync-db-from-prod.ps1
# Downloads the production SQLite database to the local dev environment.
#
# Usage:
#   .\scripts\sync-db-from-prod.ps1
#
# Required env vars (can be set in .env or exported beforehand):
#   VPS_HOST   - SSH host, e.g. "deploy@1.2.3.4"
#   VPS_DB     - Path to the DB on the server (default: /var/data/db.sqlite)
#   SSH_KEY    - Path to SSH private key (optional, defaults to ~/.ssh/id_rsa)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LocalDb = Join-Path $ScriptDir "..\packages\server\prisma\dev.db"
$LocalDb = [System.IO.Path]::GetFullPath($LocalDb)

# Load .env from repo root if present
$RootEnv = Join-Path $ScriptDir "..\.env"
if (Test-Path $RootEnv) {
    Get-Content $RootEnv | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            if (-not [System.Environment]::GetEnvironmentVariable($name)) {
                [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
}

$VpsHost = $env:VPS_HOST
if (-not $VpsHost) {
    Write-Error "VPS_HOST is not set. Export it or add it to .env"
    exit 1
}

$VpsDb  = if ($env:VPS_DB)  { $env:VPS_DB }  else { "/var/data/db.sqlite" }
$SshKey = if ($env:SSH_KEY) { $env:SSH_KEY } else { "$HOME\.ssh\id_rsa" }

$SshOpts = @("-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes")
if (Test-Path $SshKey) {
    $SshOpts += @("-i", $SshKey)
}

Write-Host "Syncing prod DB from ${VpsHost}:${VpsDb}"

# Backup existing local DB
if (Test-Path $LocalDb) {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $Backup = "$LocalDb.bak.$Timestamp"
    Copy-Item $LocalDb $Backup
    Write-Host "Backed up local DB to $Backup"
}

# Pull the file
& scp @SshOpts "${VpsHost}:${VpsDb}" $LocalDb

if ($LASTEXITCODE -ne 0) {
    Write-Error "scp failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Done. Local DB updated: $LocalDb"
