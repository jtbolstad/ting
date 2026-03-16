# Ting Deployment Script for Fly.io (Windows PowerShell)
# This script helps you deploy Ting to Fly.io quickly

$ErrorActionPreference = "Stop"

Write-Host "🚀 Ting Deployment to Fly.io" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if fly CLI is installed
if (!(Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly CLI is not installed." -ForegroundColor Red
    Write-Host "Install it with:"
    Write-Host "  iwr https://fly.io/install.ps1 -useb | iex"
    exit 1
}

Write-Host "✅ Fly CLI is installed" -ForegroundColor Green

# Check if logged in
try {
    fly auth whoami | Out-Null
    Write-Host "✅ Logged in to Fly.io" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Not logged in to Fly.io" -ForegroundColor Yellow
    Write-Host "Logging in..."
    fly auth login
}

Write-Host ""

# Get app name
$AppName = Read-Host "Enter your app name (or press Enter to auto-generate)"

# Get region
Write-Host "Common regions:"
Write-Host "  ams - Amsterdam, Netherlands"
Write-Host "  ord - Chicago, Illinois (US)"
Write-Host "  lhr - London, United Kingdom"
Write-Host "  syd - Sydney, Australia"
Write-Host "  sin - Singapore"
$Region = Read-Host "Enter your preferred region (default: ams)"
if ([string]::IsNullOrWhiteSpace($Region)) { $Region = "ams" }

Write-Host ""
Write-Host "📝 Configuration:" -ForegroundColor Cyan
if ($AppName) {
    Write-Host "  App name: $AppName"
} else {
    Write-Host "  App name: (auto-generated)"
}
Write-Host "  Region: $Region"
Write-Host ""

# Create app
Write-Host "Creating Fly app..." -ForegroundColor Yellow
if ($AppName) {
    fly launch --name $AppName --region $Region --no-deploy
} else {
    fly launch --region $Region --no-deploy
}

Write-Host "✅ App created" -ForegroundColor Green
Write-Host ""

# Create volume
Write-Host "Creating persistent volume for database and uploads..." -ForegroundColor Yellow
fly volumes create ting_data --size 1 --region $Region --yes

Write-Host "✅ Volume created" -ForegroundColor Green
Write-Host ""

# Set secrets
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
Write-Host "⚠️  Please provide a secure JWT secret (minimum 32 characters)" -ForegroundColor Yellow
$JWTSecret = Read-Host "JWT Secret" -AsSecureString
$JWTSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($JWTSecret)
)

fly secrets set `
    JWT_SECRET="$JWTSecretPlain" `
    DATABASE_URL="file:/data/db.sqlite" `
    NODE_ENV="production"

Write-Host "✅ Secrets configured" -ForegroundColor Green
Write-Host ""

# Optional: Email configuration
$SetupEmail = Read-Host "Do you want to configure email notifications? (y/N)"

if ($SetupEmail -match "^[Yy]$") {
    Write-Host "Email configuration:"
    $SMTPHost = Read-Host "SMTP Host"
    $SMTPPort = Read-Host "SMTP Port (default: 587)"
    if ([string]::IsNullOrWhiteSpace($SMTPPort)) { $SMTPPort = "587" }
    $SMTPUser = Read-Host "SMTP User"
    $SMTPPass = Read-Host "SMTP Password" -AsSecureString
    $SMTPPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SMTPPass)
    )
    
    fly secrets set `
        SMTP_HOST="$SMTPHost" `
        SMTP_PORT="$SMTPPort" `
        SMTP_USER="$SMTPUser" `
        SMTP_PASS="$SMTPPassPlain"
    
    Write-Host "✅ Email configured" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Deploying to Fly.io..." -ForegroundColor Yellow
fly deploy

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  fly logs                 - View application logs"
Write-Host "  fly status               - Check app status"
Write-Host "  fly ssh console          - SSH into your app"
Write-Host "  fly open                 - Open app in browser"
Write-Host ""
Write-Host "To update your app:"
Write-Host "  fly deploy"
Write-Host ""
