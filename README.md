# Ting - Community Tool Lending Service

A full-stack tool library management system for community makerspaces, built with Node.js, TypeScript, and React.

## Features

- 🔐 **User Authentication** - JWT-based auth with admin/member roles, with optional SmartOrg membership verification
- 📦 **Item Catalog** - Browse and search tools by category
- 📅 **Reservations** - Book items in advance with conflict detection
- ✅ **Check-in/Check-out** - Track who has what items
- 📧 **Email Reminders** - Automated due date and overdue notifications
- 👨‍💼 **Admin Dashboard** - Manage items, users, and loans
- 🎨 **Modern UI** - Responsive design with TailwindCSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Email**: Nodemailer (configurable SMTP)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

### Installation

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set up the database**:

   ```bash
   cd packages/server
   pnpm run db:migrate
   pnpm run db:seed
   ```

3. **Start the development servers**:

   In one terminal (backend):

   ```bash
   pnpm run dev:server
   ```

   In another terminal (frontend):

   ```bash
   pnpm run dev:client
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Test Accounts

After seeding, you can log in with:

- **Admin**: `admin@ting.com` / `admin123`
- **User**: `user@ting.com` / `user123`

## Project Structure

```
ting/
├── packages/
│   ├── shared/           # Shared TypeScript types
│   ├── server/           # Express API backend
│   │   ├── prisma/       # Database schema & migrations
│   │   └── src/
│   │       ├── routes/   # API endpoints
│   │       ├── services/ # Business logic
│   │       ├── jobs/     # Background jobs (reminders)
│   │       └── middleware/
│   └── client/           # React frontend
│       └── src/
│           ├── api/      # API client
│           ├── components/
│           ├── context/  # Auth state
│           └── pages/
└── package.json          # Workspace config
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Items

- `GET /api/items` - List items (with search & filters)
- `GET /api/items/:id` - Get item details
- `POST /api/items` - Create item (admin)
- `PATCH /api/items/:id` - Update item (admin)
- `DELETE /api/items/:id` - Delete item (admin)

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (admin)

### Reservations

- `GET /api/reservations` - List user's reservations
- `GET /api/reservations/availability/:itemId` - Check availability
- `POST /api/reservations` - Create reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Loans

- `GET /api/loans` - List loans
- `POST /api/loans/checkout` - Checkout item
- `POST /api/loans/:id/checkin` - Return item

### Uploads

- `POST /api/uploads/image` - Upload an image for an item
  - **Request**: `multipart/form-data` with `image` field
  - **Response**: `{ url: string, thumbnail: string }`
  - **Requirements**: Authentication, organization context
  - **Limits**: 10MB max, JPEG/PNG/GIF/WebP only
  - **Processing**: Auto-resizes to max 1200px width, converts to WebP, generates 300px thumbnail
  - **Storage**: Local filesystem at `server/uploads/{organizationId}/`
  - **Access**: Images served publicly at `/uploads/{organizationId}/{filename}`

## SmartOrg Integration

Ting can integrate with [SmartOrg](https://smartorg.no) to verify that users are active members of your organization before granting access.

### How it works

When enabled, login and registration will check the user's membership status via the SmartOrg API. Users who are not active members will be denied access.

### Setup

Add these environment variables to `packages/server/.env`:

```env
SMARTORG_API_URL=https://api.smartorg.no
SMARTORG_API_KEY=your-api-key
SMARTORG_ORG_ID=your-organization-id
```

| Variable | Description |
|---|---|
| `SMARTORG_API_URL` | SmartOrg API base URL |
| `SMARTORG_API_KEY` | API key from your SmartOrg admin panel |
| `SMARTORG_ORG_ID` | Your organization's ID in SmartOrg |

When `SMARTORG_API_KEY` is not set, the integration is disabled and all registered users can log in normally.

## Email Notifications

The system can send automated email reminders for:

- Items due tomorrow
- Overdue items

### Setup Email (Production)

Add these environment variables to `packages/server/.env`:

```env
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Ting <noreply@ting.com>"
```

### Run Reminders Manually

```bash
cd packages/server
pnpm run reminders
```

### Automated Reminders (Cron)

Set up a daily cron job to run reminders:

```bash
0 9 * * * cd /path/to/ting/packages/server && pnpm run reminders
```

## Development

### Build Shared Types

```bash
cd packages/shared
pnpm run build
```

### Database Migrations

```bash
cd packages/server
pnpm run db:migrate
```

### Reset Database

```bash
cd packages/server
rm prisma/dev.db
pnpm run db:migrate
pnpm run db:seed
```

## Production Deployment

### Quick Deploy to Fly.io

Ting is ready to deploy to Fly.io with a single command:

```bash
# Install Fly CLI and login
fly auth login

# Deploy (includes database setup)
fly launch
```

For detailed deployment instructions including:

- SQLite vs PostgreSQL options
- Environment variable configuration
- Custom domain setup
- Monitoring and troubleshooting

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete guide.

### Manual Deployment

1. **Build all packages**:

   ```bash
   pnpm run build
   ```

2. **Set production environment variables** in `packages/server/.env`:

   ```env
   NODE_ENV=production
   DATABASE_URL="file:/data/db.sqlite"
   JWT_SECRET="your-secure-random-secret"
   ```

3. **Run migrations**:

   ```bash
   cd packages/server
   pnpm db:migrate deploy
   ```

4. **Start the server**:
   ```bash
   pnpm start
   ```

The server will automatically serve the built frontend from `packages/client/dist` in production mode.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
