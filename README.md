# RentNest Backend

Rental property marketplace API — Express + TypeScript + Prisma + Postgres (Neon).

## Stack

- **Runtime:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Auth:** JWT, role-based access (`TENANT`, `LANDLORD`, `ADMIN`)
- **Payments:** SSLCommerz (sandbox)
- **Images:** Cloudinary

## Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Copy the env template and fill in real values (Neon connection strings, JWT secret, Cloudinary and SSLCommerz credentials)
   ```bash
   cp .env.example .env
   ```

3. Push the schema to your Neon database and generate the Prisma client
   ```bash
   npx prisma migrate dev --name init
   ```

4. Seed the admin user
   ```bash
   npm run prisma:seed
   ```

5. Run the dev server
   ```bash
   npm run dev
   ```

The API boots at `http://localhost:5000`. Health check: `GET /api/health`.

## Project structure

```
prisma/
  schema.prisma      # Data model
  seed.ts            # Admin + reference data seeding
src/
  config/env.ts      # Validated environment config
  lib/prisma.ts       # Prisma client singleton
  middleware/
    auth.ts           # JWT verification + role guard
    errorHandler.ts   # Global error handler -> { success, message, errorDetails }
    notFound.ts        # 404 handler, same response shape
  utils/
    ApiError.ts        # Typed error class with status-code factories
    ApiResponse.ts      # Success response helper
  routes/index.ts       # Root router (feature routers mount here)
  app.ts                # Express app + middleware pipeline
  server.ts             # Entry point
```

## Status

Scaffold complete. Feature modules (auth, properties, rental requests, payments,
reviews, admin) are built incrementally on top of this base.
