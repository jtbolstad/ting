# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy all source files
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build packages from workspace root
RUN pnpm --filter @ting/shared build
RUN pnpm --filter @ting/client build

# Generate Prisma Client and build server
WORKDIR /app/packages/server
RUN pnpm db:generate

# Compile seed script
RUN pnpm exec tsc prisma/seed.ts --outDir prisma --esModuleInterop --resolveJsonModule --skipLibCheck --module commonjs --target es2020

WORKDIR /app
RUN pnpm --filter @ting/server build

# Production stage
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma
COPY --from=builder /app/packages/client/dist ./packages/client/dist

# Copy uploads directory structure
COPY --from=builder /app/packages/server/uploads ./packages/server/uploads

WORKDIR /app/packages/server

# Create data directory for SQLite database and uploads with proper permissions
RUN mkdir -p /var/data/uploads && \
    chmod -R 777 /var/data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["sh", "-c", "pnpm exec prisma generate && pnpm exec prisma migrate deploy && node prisma/seed.js && node dist/src/index.js"]
