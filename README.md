# RentNest Backend

Rental property marketplace API — landlords list properties, tenants submit rental
requests and pay for approved ones, admins moderate the platform. Built with
Express, TypeScript, and Prisma on PostgreSQL (Neon).

## Tech Stack

| Area       | Choice                                          |
| ---------- | ----------------------------------------------- |
| Runtime    | Node.js + Express + TypeScript                  |
| Database   | PostgreSQL (Neon) via Prisma ORM                |
| Auth       | JWT, role-based (`TENANT`, `LANDLORD`, `ADMIN`) |
| Payments   | SSLCommerz (sandbox)                            |
| Images     | Cloudinary                                      |
| Docs       | OpenAPI 3.0 + Swagger UI, Postman collection    |
| Testing    | Jest + Supertest                                |
| Deployment | Render                                          |

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy the env template and fill in real values

   ```bash
   cp .env.example .env
   ```

   See [Environment Variables](#environment-variables) below for what each one is for.

3. Push the schema to database and generate the Prisma client

   ```bash
   npx prisma migrate dev --name init
   ```

4. Seed demo data (admin, landlords, tenants, properties, rental requests, one review)

   ```bash
   npm run prisma:seed
   ```

5. Run the dev server
   ```bash
   npm run dev
   ```

The API boots at `http://localhost:5000`. Health check: `GET /api/health`.

## Environment Variables

| Variable                                                                 | Required | Notes                                                                                                 |
| ------------------------------------------------------------------------ | :------: | ----------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                               |          | `development` \| `production` \| `test` (default `development`)                                       |
| `PORT`                                                                   |          | Default `5000`                                                                                        |
| `CLIENT_URL`                                                             |          | CORS origin (default `*`)                                                                             |
| `API_BASE_URL`                                                           |    YES    | Builds SSLCommerz success/fail/cancel/IPN callback URLs — must be the real deployed URL in production |
| `DATABASE_URL`                                                           |    YES    | Neon **pooled** connection string (runtime queries)                                                   |
| `DIRECT_URL`                                                             |          | Neon **direct** connection string (Prisma migrations)                                                 |
| `JWT_SECRET`                                                             |    YES    | Long random secret                                                                                    |
| `JWT_EXPIRES_IN`                                                         |          | Default `7d`                                                                                          |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` |          | Property image uploads; omitted → uploads are skipped, no error                                       |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD`                      |    YES    | Sandbox credentials from [SSLCommerz](https://developer.sslcommerz.com/)                              |
| `SSLCOMMERZ_IS_LIVE`                                                     |          | Default `false` (sandbox)                                                                             |

## Available Scripts

| Script                            | Purpose                                    |
| --------------------------------- | ------------------------------------------ |
| `npm run dev`                     | Start the dev server with hot reload       |
| `npm run build`                   | Type-check and compile to `dist/`          |
| `npm start`                       | Run the compiled server (`dist/server.js`) |
| `npm run prisma:generate`         | Regenerate the Prisma client               |
| `npm run prisma:migrate`          | Run migrations locally                     |
| `npm run prisma:seed`             | Seed demo data                             |
| `npm test`                        | Run the Jest/Supertest smoke test suite    |
| `npm run lint` / `lint:fix`       | ESLint check / autofix                     |
| `npm run format` / `format:check` | Prettier write / check                     |

## Project Structure

```
prisma/
  schema.prisma          # Data model
  seed.ts                # Admin + demo data seeding
src/
  config/env.ts          # Zod-validated environment config
  lib/
    prisma.ts             # Prisma client singleton
    cloudinary.ts          # Cloudinary upload helper
  middleware/
    auth.ts                # JWT verification + role guard
    rateLimiter.ts          # Rate limiting for auth endpoints
    validate.ts             # Generic zod body/query/params validator
    upload.ts               # Multer (multipart image upload)
    errorHandler.ts         # Global error handler -> { success, message, errorDetails }
    notFound.ts             # 404 handler, same response shape
  modules/
    auth/ categories/ properties/ rentals/ payments/ reviews/ admin/
      *.validation.ts      # Zod schemas
      *.service.ts         # Business logic (touches Prisma)
      *.controller.ts      # Thin HTTP layer
      *.routes.ts          # Wires validate + auth + controller
  docs/openapi.ts         # Hand-authored OpenAPI 3.0 spec
  utils/
    ApiError.ts            # Typed error + status-code factories
    ApiResponse.ts          # Success response helper
  routes/index.ts         # Mounts every module's router under /api
  app.ts                  # Express app + middleware pipeline
  server.ts               # Entry point
tests/                    # Jest + Supertest smoke tests (real DB, self-cleaning)
postman/                  # Postman collection + local/Render environments
```

## API Documentation

- **Swagger UI:** `GET /api/docs` (raw spec at `GET /api/docs.json`)
- **Postman:** import `postman/RentNest.postman_collection.json` plus the matching
  `RentNest-Local.postman_environment.json` or `RentNest-Render.postman_environment.json`

## API Endpoints

All responses are wrapped as `{ success, message, data? }` on success and
`{ success, message, errorDetails }` on error — see [Error Response Format](#error-response-format).

### Auth

| Method | Endpoint             | Access        | Notes                                           |
| ------ | -------------------- | ------------- | ----------------------------------------------- |
| POST   | `/api/auth/register` | Public        | Rate-limited. `role` limited to TENANT/LANDLORD |
| POST   | `/api/auth/login`    | Public        | Rate-limited. Returns JWT + user                |
| GET    | `/api/auth/me`       | Authenticated | Current user from JWT                           |

### Categories & Properties

| Method | Endpoint                       | Access                                                                                     |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------ |
| GET    | `/api/categories`              | Public                                                                                     |
| GET    | `/api/properties`              | Public — filters: `location`, `search`, `categoryId`, `minPrice`/`maxPrice`, `isAvailable` |
| GET    | `/api/properties/:id`          | Public                                                                                     |
| POST   | `/api/landlord/properties`     | LANDLORD — Cloudinary upload on create                                                     |
| PUT    | `/api/landlord/properties/:id` | LANDLORD (own listings only)                                                               |
| DELETE | `/api/landlord/properties/:id` | LANDLORD (own listings only) — blocked if it has rental requests                           |

### Rental Requests

| Method | Endpoint                     | Access                                      |
| ------ | ---------------------------- | ------------------------------------------- |
| POST   | `/api/rentals`               | TENANT — submit request                     |
| GET    | `/api/rentals`               | TENANT (own) / LANDLORD (own properties)    |
| GET    | `/api/rentals/:id`           | Owner (tenant or landlord)                  |
| GET    | `/api/landlord/requests`     | LANDLORD                                    |
| PATCH  | `/api/landlord/requests/:id` | LANDLORD — approve/reject a pending request |

### Payments (SSLCommerz)

| Method | Endpoint                | Access                                             |
| ------ | ----------------------- | -------------------------------------------------- |
| POST   | `/api/payments/create`  | TENANT — creates a session for an APPROVED request |
| POST   | `/api/payments/confirm` | Public — success/fail/cancel redirect handler      |
| POST   | `/api/payments/ipn`     | Public — SSLCommerz IPN callback                   |
| GET    | `/api/payments`         | TENANT (own history)                               |
| GET    | `/api/payments/:id`     | Owner (tenant/landlord/admin)                      |

### Reviews

| Method | Endpoint                            | Access                                                                         |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------ |
| POST   | `/api/reviews`                      | TENANT — only if the linked rental request is COMPLETED, one review per rental |
| GET    | `/api/reviews/property/:propertyId` | Public — paginated, includes average rating                                    |

### Admin

| Method | Endpoint                    | Access                                              |
| ------ | --------------------------- | --------------------------------------------------- |
| GET    | `/api/admin/users`          | ADMIN — filter by role/status, paginated            |
| PATCH  | `/api/admin/users/:id`      | ADMIN — ban/unban (admin accounts excluded)         |
| GET    | `/api/admin/properties`     | ADMIN — filter by category/availability, paginated  |
| GET    | `/api/admin/rentals`        | ADMIN — filter by status, paginated                 |
| POST   | `/api/admin/categories`     | ADMIN — create category                             |
| PUT    | `/api/admin/categories/:id` | ADMIN — rename category                             |
| DELETE | `/api/admin/categories/:id` | ADMIN — blocked if any property still references it |

## Error Response Format

Every error, whatever the source (validation, auth, Prisma, or unexpected), returns
the same shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": [{ "path": "body.email", "message": "Invalid email address" }]
}
```

## Testing

```bash
npm test
```

Jest + Supertest smoke tests run against a real database (not mocks). Each suite
registers its own tenants/landlords/categories/properties with unique emails and
deletes them in `afterAll`, so a run never touches or pollutes the seeded demo
accounts. Coverage: auth, properties, rental requests, payments (guard rails —
role/ownership/status checks, without hitting the live SSLCommerz sandbox),
reviews, and admin.

## Demo Accounts

All demo passwords are `Demo@123`, except the admin account.

| Role     | Email                    | Password    | Notes                                                                                                                  |
| -------- | ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Admin    | `admin@rentnest.com`     | `Admin@123` | Ban/unban users, category CRUD, platform-wide views                                                                    |
| Landlord | `landlord1@rentnest.com` | `Demo@123`  | Owns Gulshan apartment, Dhanmondi studio, Mirpur sublet                                                                |
| Landlord | `landlord2@rentnest.com` | `Demo@123`  | Owns Uttara house, Banani duplex                                                                                       |
| Tenant   | `tenant1@rentnest.com`   | `Demo@123`  | Has a COMPLETED rental (with payment + review), an ACTIVE rental (with payment), and a REJECTED request                |
| Tenant   | `tenant2@rentnest.com`   | `Demo@123`  | Has an APPROVED request (unpaid — good for testing `/api/payments/create`), a PENDING request, and a CANCELLED request |

`ADMIN` is not a self-registrable role — only `TENANT`/`LANDLORD` can sign up via
`/api/auth/register`; the admin account only ever comes from the seed script.

## Deployment

Deployed on Render via the `render.yaml` blueprint (Node web service, Neon as the
external database). On first deploy, `API_BASE_URL` must be updated to the assigned
`.onrender.com` URL and the service redeployed — SSLCommerz's success/fail/cancel/IPN
callback URLs are built from it, and left as `localhost` those callbacks silently fail.

Live API: _not deployed yet_
