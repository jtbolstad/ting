#!/bin/bash

# Ting Deployment Script for Fly.io
# This script helps you deploy Ting to Fly.io quickly

set -e  # Exit on error

echo "🚀 Ting Deployment to Fly.io"
echo "================================"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed."
    echo "Install it with:"
    echo "  curl -L https://fly.io/install.sh | sh"
    exit 1
fi

echo "✅ Fly CLI is installed"

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "⚠️  Not logged in to Fly.io"
    echo "Logging in..."
    fly auth login
fi

echo "✅ Logged in to Fly.io"
echo ""

# Get app name
read -p "Enter your app name (or press Enter to auto-generate): " APP_NAME

# Get region
echo "Common regions:"
echo "  ams - Amsterdam, Netherlands"
echo "  ord - Chicago, Illinois (US)"
echo "  lhr - London, United Kingdom"
echo "  syd - Sydney, Australia"
echo "  sin - Singapore"
read -p "Enter your preferred region (default: ams): " REGION
REGION=${REGION:-ams}

echo ""
echo "📝 Configuration:"
if [ -n "$APP_NAME" ]; then
    echo "  App name: $APP_NAME"
else
    echo "  App name: (auto-generated)"
fi
echo "  Region: $REGION"
echo ""

# Create app
echo "Creating Fly app..."
if [ -n "$APP_NAME" ]; then
    fly launch --name "$APP_NAME" --region "$REGION" --no-deploy
else
    fly launch --region "$REGION" --no-deploy
fi

# Get the actual app name
ACTUAL_APP_NAME=$(fly status --json | grep -o '"Name":"[^"]*' | cut -d'"' -f4)
echo ""
echo "✅ App created: $ACTUAL_APP_NAME"

# Create volume
echo ""
echo "Creating persistent volume for database and uploads..."
fly volumes create ting_data --size 1 --region "$REGION" --yes

echo "✅ Volume created"
echo ""

# Set secrets
echo "Setting up environment variables..."
echo "⚠️  Please provide a secure JWT secret (minimum 32 characters)"
read -sp "JWT Secret: " JWT_SECRET
echo ""

fly secrets set \
    JWT_SECRET="$JWT_SECRET" \
    DATABASE_URL="file:/data/db.sqlite" \
    NODE_ENV="production"

echo "✅ Secrets configured"
echo ""

# Optional: Email configuration
read -p "Do you want to configure email notifications? (y/N): " SETUP_EMAIL

if [[ "$SETUP_EMAIL" =~ ^[Yy]$ ]]; then
    echo "Email configuration:"
    read -p "SMTP Host: " SMTP_HOST
    read -p "SMTP Port (default: 587): " SMTP_PORT
    SMTP_PORT=${SMTP_PORT:-587}
    read -p "SMTP User: " SMTP_USER
    read -sp "SMTP Password: " SMTP_PASS
    echo ""
    
    fly secrets set \
        SMTP_HOST="$SMTP_HOST" \
        SMTP_PORT="$SMTP_PORT" \
        SMTP_USER="$SMTP_USER" \
        SMTP_PASS="$SMTP_PASS"
    
    echo "✅ Email configured"
fi

echo ""
echo "🚀 Deploying to Fly.io..."
fly deploy

echo ""
echo "================================"
echo "✅ Deployment complete!"
echo ""
echo "Your app is available at: https://${ACTUAL_APP_NAME}.fly.dev"
echo ""
echo "Useful commands:"
echo "  fly logs                 - View application logs"
echo "  fly status               - Check app status"
echo "  fly ssh console          - SSH into your app"
echo "  fly open                 - Open app in browser"
echo ""
echo "To update your app:"
echo "  fly deploy"
echo ""
