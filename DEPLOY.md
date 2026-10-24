# Deploying Strings

## Local development (SQLite)

    npm install
    npx prisma migrate dev
    npm run dev

## Local with Docker + Postgres

1. Copy `.env` → `.env.production` and fill in real values.
2. Build and start:

       docker compose up --build

3. App runs at http://localhost:3000. Postgres is at localhost:5432.

## Production

The image is built for platforms that support `Dockerfile` (Fly.io, Render, Railway, Cloud Run, ECS).

### Required environment variables

See `.env.production.example`. The non-negotiable ones:

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — 64-byte base64 (openssl rand -base64 64)
- `NODE_ENV=production`

### First deploy

1. Provision a Postgres database (managed, e.g. Neon/Supabase/RDS).
2. Set env vars on the platform.
3. Run migrations once:

       npm run db:migrate:prod

   Or, in a Docker context, an entrypoint that runs `prisma migrate deploy` before `server.mjs` starts.

4. Deploy. Health endpoint: `GET /api/health` must return `{ ok: true }`.

## Known limitations

- File uploads write to `public/uploads`. In Docker that's a named volume. On multi-instance hosts, switch to S3/R2 (upload code already abstracts the URL return).
- Socket.IO is single-instance. For horizontal scaling, add `@socket.io/redis-adapter` and a Redis instance.
- No email provider failover — if Brevo is down, verification emails fail. Dev mode (no API key) still works.
- No rate limiting — add `@fastify/rate-limit` or reverse-proxy-level limits before public launch.
- No CSP/CORS policy — set at reverse proxy.
