# Deploying Ting

This guide covers deployment to Render and Fly.io with persistent storage for SQLite and file uploads.

## Deploying to Render

### Prerequisites

1. Render account (free tier available)
2. GitHub repository connected to Render
3. Docker support enabled

### 1. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `ting` (or your choice)
   - **Environment**: `Docker`
   - **Region**: Choose closest to users
   - **Branch**: `main`
   - **Instance Type**: `Free` or `Starter`

### 2. Add Persistent Disk (CRITICAL for uploads & database)

**This step is required for image uploads and SQLite database persistence!**

1. In your service settings, go to **Disks**
2. Click **Add Disk**
3. Configure:
   - **Name**: `ting-data`
   - **Mount Path**: `/var/data` ⚠️ **Must be exactly this path**
   - **Size**: 1 GB (increase as needed)
4. Click **Create Disk**

### 3. Set Environment Variables

In your service's **Environment** tab, add:

```
DATABASE_URL=file:/var/data/db.sqlite
JWT_SECRET=<generate-a-long-random-string>
PORT=8080
NODE_ENV=production
```

**Generate a secure JWT_SECRET:**

```bash
openssl rand -base64 32
```

### 4. Deploy

1. Click **Manual Deploy** → **Deploy latest commit**
2. Monitor build logs
3. Once deployed, your app will be at `https://your-app.onrender.com`

### 5. Verify Upload Functionality

Check logs for:

```
📁 Uploads directory: /var/data/uploads
```

If you see errors about permissions or missing directories, the disk mount may not be configured correctly.

### Troubleshooting Render

**Images not uploading:**

- Verify `/var/data` disk is mounted in service settings
- Check logs for "Failed to create upload directory" errors
- Ensure `NODE_ENV=production` or `RENDER=true` env var is set

**Database wiped on redeploy:**

- Add a persistent disk at `/var/data`
- Verify `DATABASE_URL=file:/var/data/db.sqlite`

**Cannot access uploaded images:**

- Images are served at `/uploads/{organizationId}/{filename}`
- Check that disk has write permissions (fixed in Dockerfile)

---

## Deploying to Fly.io

1. Install the Fly CLI:

   ```bash
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh

   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. Sign up and log in:
   ```bash
   fly auth signup
   # or
   fly auth login
   ```

## Option 1: Deploy with SQLite (Simpler, good for small to medium apps)

### 1. Create a Fly App

```bash
fly launch --no-deploy
```

When prompted:

- Choose your app name (or use the suggested one)
- Choose your region (closest to your users)
- Don't deploy yet (we selected `--no-deploy`)

### 2. Create a Persistent Volume

SQLite needs persistent storage:

```bash
fly volumes create ting_data --size 1 --region <your-region>
```

Replace `<your-region>` with your chosen region (e.g., `ams` for Amsterdam).

### 3. Set Environment Variables

```bash
fly secrets set JWT_SECRET="your-super-secret-jwt-key-change-this"
fly secrets set DATABASE_URL="file:/data/db.sqlite"
fly secrets set NODE_ENV="production"
```

**Important:** Use a strong random string for `JWT_SECRET` in production!

### 4. Deploy

```bash
fly deploy
```

### 5. Monitor and Check

```bash
# View logs
fly logs

# Check status
fly status

# Open in browser
fly open
```

## Option 2: Deploy with PostgreSQL (Better for production)

### 1. Create a Postgres Database

```bash
fly postgres create
```

Follow the prompts:

- Choose a name for your database (e.g., `ting-db`)
- Choose your region (same as your app)
- Choose configuration (Development for testing, Production for real use)

### 2. Attach Database to Your App

```bash
fly postgres attach --app <your-app-name> <your-db-name>
```

This automatically sets the `DATABASE_URL` secret.

### 3. Update Prisma Schema

In `packages/server/prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "postgresql"  // changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 4. Update Migrations

You'll need to recreate migrations for PostgreSQL:

```bash
# Delete old SQLite migrations
rm -rf packages/server/prisma/migrations

# Create new PostgreSQL migrations
cd packages/server
pnpm db:migrate
```

### 5. Set Other Secrets

```bash
fly secrets set JWT_SECRET="your-super-secret-jwt-key-change-this"
fly secrets set NODE_ENV="production"
```

### 6. Deploy

```bash
fly deploy
```

## Post-Deployment

### Scale Your App

```bash
# Scale to 2 instances for high availability
fly scale count 2

# Adjust memory
fly scale memory 512  # 512MB
```

### Set Up Custom Domain

```bash
# Add a certificate for your domain
fly certs add yourdomain.com

# Then add DNS records as instructed by Fly
```

### Database Backups (PostgreSQL)

Fly automatically backs up Postgres databases. View backups:

```bash
fly postgres backups list -a <your-db-name>
```

### Monitoring

```bash
# View metrics
fly dashboard

# SSH into your app
fly ssh console

# Check database status (PostgreSQL)
fly postgres connect -a <your-db-name>
```

## Environment Variables Reference

| Variable       | Required | Description                        | Example                                |
| -------------- | -------- | ---------------------------------- | -------------------------------------- |
| `DATABASE_URL` | Yes      | Database connection string         | `file:/data/db.sqlite` or Postgres URL |
| `JWT_SECRET`   | Yes      | Secret key for JWT tokens          | Random 32+ character string            |
| `NODE_ENV`     | Yes      | Environment mode                   | `production`                           |
| `PORT`         | No       | Port to run on (set automatically) | `8080`                                 |
| `SMTP_HOST`    | No       | Email server host                  | `smtp.gmail.com`                       |
| `SMTP_PORT`    | No       | Email server port                  | `587`                                  |
| `SMTP_USER`    | No       | Email username                     | `your-email@example.com`               |
| `SMTP_PASS`    | No       | Email password                     | `your-password`                        |

## Troubleshooting

### App Won't Start

```bash
# Check logs
fly logs

# SSH into the app
fly ssh console

# Check if database is accessible
ls -la /data
```

### Database Connection Issues

**SQLite:**

- Ensure volume is mounted: `fly volumes list`
- Check DATABASE_URL: `fly secrets list`

**PostgreSQL:**

- Check connection: `fly postgres connect -a <your-db-name>`
- Verify attachment: `fly postgres list`

### Migrations Not Running

```bash
# Run migrations manually
fly ssh console -C "cd packages/server && npx prisma migrate deploy"
```

### Upload Issues

Check that `/data/uploads` directory is being created:

```bash
fly ssh console
ls -la /data
```

## Updating Your App

```bash
# Make your changes locally
git add .
git commit -m "Your changes"

# Deploy the update
fly deploy
```

## Cleanup

To delete your app:

```bash
fly apps destroy <your-app-name>
```

To delete a volume:

```bash
fly volumes destroy <volume-id>
```

## Cost Estimation

Fly.io pricing (as of 2026):

- **Free tier**: 3 shared-cpu-1x VMs, 3GB storage
- **Paid tier**: ~$2-5/month for small apps
- **PostgreSQL**: ~$2-15/month depending on size

See [Fly.io Pricing](https://fly.io/docs/about/pricing/) for details.

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Postgres](https://fly.io/docs/postgres/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
