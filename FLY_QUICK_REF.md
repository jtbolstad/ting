# Fly.io Quick Reference

## Initial Setup

```bash
# Install Fly CLI (Windows PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Or use the deployment script
.\deploy.ps1
```

## Common Commands

```bash
# Deploy updates
fly deploy

# View logs (live)
fly logs

# Check app status
fly status

# Open app in browser
fly open

# SSH into the running app
fly ssh console

# View environment variables
fly secrets list

# Set a new secret
fly secrets set KEY=value

# Scale your app
fly scale count 2        # Run 2 instances
fly scale memory 512     # Use 512MB RAM

# Restart the app
fly apps restart

# Check volume status
fly volumes list

# Access database (if using SQLite)
fly ssh console -C "cd /data && ls -la"
```

## Database Operations

```bash
# Run migrations
fly ssh console -C "cd packages/server && npx prisma migrate deploy"

# Check database file
fly ssh console -C "ls -la /data"

# Backup SQLite database
fly ssh console -C "cat /data/db.sqlite" > backup.db

# Restore SQLite database
fly ssh console -C "cat > /data/db.sqlite" < backup.db
```

## Monitoring

```bash
# Open Fly.io dashboard
fly dashboard

# View metrics
fly monitoring

# Check resource usage
fly vm status
```

## Environment Variables

Set these secrets for production:

```bash
fly secrets set JWT_SECRET="your-super-secret-key"
fly secrets set DATABASE_URL="file:/data/db.sqlite"
fly secrets set NODE_ENV="production"

# Optional: Email
fly secrets set SMTP_HOST="smtp.gmail.com"
fly secrets set SMTP_PORT="587"
fly secrets set SMTP_USER="your-email@example.com"
fly secrets set SMTP_PASS="your-password"
```

## Troubleshooting

```bash
# App won't start
fly logs
fly ssh console

# Database issues
fly ssh console -C "ls -la /data"
fly volumes list

# Clear cache and redeploy
fly deploy --no-cache

# Destroy and recreate (CAREFUL!)
fly apps destroy your-app-name
```

## Updating the App

```bash
# Make changes locally
git add .
git commit -m "Your changes"

# Deploy
fly deploy
```

## Custom Domain

```bash
# Add SSL certificate
fly certs add yourdomain.com

# Check certificate status
fly certs show yourdomain.com

# List certificates
fly certs list
```

## Cost Control

```bash
# Stop app (to save costs)
fly scale count 0

# Resume app
fly scale count 1

# Set auto-stop (in fly.toml)
auto_stop_machines = "stop"
auto_start_machines = true
min_machines_running = 0
```

## Regions

Common regions (choose closest to users):

- `ams` - Amsterdam, Netherlands 🇳🇱
- `ord` - Chicago, Illinois 🇺🇸
- `lhr` - London, United Kingdom 🇬🇧
- `fra` - Frankfurt, Germany 🇩🇪
- `syd` - Sydney, Australia 🇦🇺
- `sin` - Singapore 🇸🇬
- `nrt` - Tokyo, Japan 🇯🇵

## Need Help?

- Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Fly.io docs: https://fly.io/docs/
- Fly.io community: https://community.fly.io/
