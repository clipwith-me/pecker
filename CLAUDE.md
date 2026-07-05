# CLAUDE.md — Pecker Project

**Pecker** is a production-grade, mobile-first Community Incident Management Platform.  
Live: https://pecker-app.vercel.app | Stack: Next.js 16 · Prisma 5 · Neon PostgreSQL · NextAuth v5 · Tailwind v3 · Vercel

---

## REPO LAYOUT

```
src/app/
  api/auth/register         POST  — public signup (RESIDENT or RESPONDER)
  api/auth/[...nextauth]    NextAuth handler
  api/incidents/            GET list / POST create
  api/incidents/[id]/       GET · PATCH · DELETE
  api/incidents/[id]/status PATCH — lifecycle transitions
  api/incidents/[id]/assign PATCH — assign to responder
  api/incidents/[id]/escalate POST — bump to CRITICAL, notify admins
  api/incidents/[id]/note   POST  — append audit note
  api/dashboard/stats       GET   — KPI aggregates (admin only)
  api/notifications/        GET list · PATCH mark-read
  api/upload/               POST  — Vercel Blob (prod) / local FS (dev)
  api/users/                GET · PATCH (admin role management)
  api/seed/                 POST  — demo data (requires SEED_SECRET header)
  admin/                    Dashboard + user management pages
  incidents/                List · Detail · New wizard (5 steps)
  login/ register/          Auth pages
  deliverables/             Hackathon docs hub
src/lib/
  auth.ts                   NextAuth config, JWT + RBAC callbacks
  db.ts                     Prisma singleton (globalThis pattern)
  types.ts                  All enums, constants, status transition map
  validations.ts            Zod schemas for every API input
src/components/ui/          shadcn-style primitives, PeckerLogo SVG
src/hooks/                  useToast, useIncidents, useNotifications
prisma/
  schema.prisma             PostgreSQL, all enum-like fields as String
  migrations/               migration_lock.toml must say "postgresql"
public/deliverables/        architecture.html · business-gtm.html
```

---

## ENVIRONMENT

### Local `.env`
```
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Vercel (dashboard or `vercel env add`)
```
DATABASE_URL        neon URL + ?sslmode=require&connect_timeout=15&pool_timeout=15&connection_limit=5
NEXTAUTH_SECRET     same value as local
NEXTAUTH_URL        https://pecker-app.vercel.app
NEXT_PUBLIC_APP_URL https://pecker-app.vercel.app
SEED_SECRET         any string — guards /api/seed
BLOB_READ_WRITE_TOKEN  from Vercel Storage → Blob (enables photo uploads)
```

---

## RBAC

| Role | Self-register | Capabilities |
|------|--------------|--------------|
| RESIDENT | yes | Report + view own incidents |
| RESPONDER | yes | Manage all incidents, assign, escalate |
| ADMIN | no (promoted only) | Everything + user management + dashboard |

Promotion path: Admin → /admin/users → change role dropdown.

---

## COMMANDS

```bash
npm run dev                        # dev server
npm run build                      # prisma generate + next build
npx prisma db push                 # push schema to Neon (no migration history)
npm test                           # jest, 37+ tests

vercel --prod --yes                # deploy
vercel alias set <new-url> pecker-app.vercel.app   # update stable alias
```

**Seed demo data** (after db push):
```bash
curl -X POST https://pecker-app.vercel.app/api/seed \
  -H "Authorization: Bearer <SEED_SECRET>"
```

---

## ARCHITECTURAL DECISIONS

| Decision | Why |
|----------|-----|
| Prisma enums → String fields | SQLite compat during dev; Zod enforces values |
| `globalThis` Prisma singleton | Prevents connection pool exhaustion in hot-reload |
| No Neon serverless adapter | adapter-neon v7 requires Prisma v7; plain PrismaClient + timeout params works |
| `useForm<any>` for forms with Zod `.default()` | Input/output type mismatch breaks Resolver generic |
| Tailwind v3 pinned | v4 is PostCSS-incompatible with all v3 component patterns |
| Next.js 16.2.7 | Earlier versions blocked by Vercel CVE policy |

Full lessons: `.claude/engineering.md`
