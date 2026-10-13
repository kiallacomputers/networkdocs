# NetworkDocs — self-hosted infrastructure documentation (v0.1 MVP)

A working starter project for multi-user campus/site documentation: visual rack elevation, equipment inventory, and one-to-one cable mapping. Built using Nuxt 4, PostgreSQL and cookie-based authentication.

## Requirements
- Node.js 22+, PostgreSQL 16+ (or Docker + Docker Compose)
- A reverse proxy with HTTPS for production (Caddy, Nginx, etc.)

## Quick start (Docker)
1. Copy `.env.example` to `.env`.
2. Set `POSTGRES_PASSWORD` (used by Compose), `SESSION_SECRET` (random 32+ chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ chars).
3. Run `docker compose up -d --build`.
4. Initialize schema and admin account **once**:
   `docker compose exec -e ADMIN_EMAIL=admin@example.org -e ADMIN_PASSWORD='your-strong-password' app ./node_modules/.bin/tsx scripts/init-db.ts`
   Replace values with your actual admin email/password. Note: command-line secrets can appear in shell history; use a temporary env file or secret manager for deployment.
5. Browse to `http://127.0.0.1:3000` on the host, or expose through an HTTPS reverse proxy.

## Quick start (local development)
1. `npm install`
2. Create `.env` from `.env.example`, set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. `npm run db:init`
4. `npm run dev`

## Current capabilities
- Login sessions stored server-side (hashed random session tokens, HttpOnly SameSite cookies)
- Roles: admin, editor, viewer (users provisioned through database for this first version)
- Sites and racks (1–60U)
- Device inventory: switches, patch panels, routers, firewalls, servers, UPS
- Device rack placement with collision and height validation, drag/drop UI
- Automatic port creation for each device
- One-to-one cable mapping, uniqueness checks, disconnect
- Audit log for creation, moves, and disconnects

## Known MVP limitations
- No user management UI yet: add accounts with securely generated bcrypt hashes in database; do not insert plaintext passwords.
- No device editing/removal UI, bulk CSV import, rack rear elevation, patch outlet endpoints, link tracing across multiple hops, floor plans, diagrams export, or RBAC site scoping yet.
- Schema is initialized using `scripts/init-db.ts`, not migrations. Use migrations for future schema changes.
- `docker compose` defaults to localhost binding intentionally. Configure an HTTPS reverse proxy for LAN access.
- Set secure cookies by serving HTTPS; production HTTP logins will not persist secure cookies.
- Database backup, PostgreSQL TLS, rate limiting, account lockouts, MFA, password reset, CSRF controls beyond SameSite, and external SSO are not included. Deploy behind appropriate access controls until hardened.
- No automated integration test suite has been run; validate in a staging environment before production use.

## Suggested next phase
Account administration, equipment/port editing, site-specific permissions, patch panel port grid, multi-hop tracing, rack template library, floor plans, CSV import/export, automated tests and backup/restore procedures.
