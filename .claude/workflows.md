# workflows.md — Pecker Execution Workflows

## 1. FEATURE DEVELOPMENT LIFECYCLE

```
INTAKE
  └─ Define: what problem, which user role, what API change
  └─ Check VALID_STATUS_TRANSITIONS if touching incident lifecycle
  └─ Check RBAC impact — which roles need access

PLAN
  └─ Schema change? → update prisma/schema.prisma → npx prisma db push
  └─ New Zod schema? → add to src/lib/validations.ts
  └─ New type? → add to src/lib/types.ts

BUILD
  └─ API route → validate with Zod → RBAC check → DB op → return envelope
  └─ UI → mobile-first, Tailwind v3 classes only
  └─ Write/update tests

VERIFY (local)
  └─ npm run build  (must be zero errors — TypeScript strict)
  └─ npm test       (must pass all 37+)
  └─ Manual test on localhost:3000

DEPLOY
  └─ cd "C:\Users\HomePC"
  └─ git add Desktop/Pecker/<changed files>  (explicit paths only)
  └─ git commit -m "..."
  └─ cd "C:\Users\HomePC\Desktop\Pecker" && vercel --prod --yes
  └─ vercel alias set <new-url> pecker-app.vercel.app

VERIFY (production)
  └─ Hit affected API endpoint
  └─ Check vercel logs if 500
  └─ Update .claude/memory.md with new deployment URL

DOCUMENT
  └─ If a new lesson learned → .claude/engineering.md
  └─ If security impact → .claude/security.md
  └─ Update memory.md current state
```

---

## 2. DATABASE CHANGE WORKFLOW

```
1. Edit prisma/schema.prisma
2. npx prisma db push              # syncs Neon — no migration needed
3. npx prisma generate             # regenerates client
4. Update Zod schema if enum values changed
5. Update src/lib/types.ts if new type needed
6. Test locally
7. Deploy — Vercel runs prisma generate on postinstall automatically
```

**Never run `prisma migrate dev` against production Neon DB.**  
Use `prisma db push` for schema-first iteration; save migrations for stable releases.

---

## 3. INCIDENT RESPONSE WORKFLOW (application layer)

```
RESIDENT reports incident
  └─ POST /api/incidents → status: NEW → notify all admins + responders

RESPONDER acknowledges
  └─ PATCH /api/incidents/[id]/status { status: "ACKNOWLEDGED" }
  └─ Incident event logged, reporter notified

RESPONDER takes action
  └─ PATCH /api/incidents/[id]/status { status: "IN_PROGRESS" }

RESPONDER resolves
  └─ PATCH → "RESOLVED" → resolvedAt timestamp set → reporter notified

ADMIN closes or rejects
  └─ PATCH → "CLOSED" | "REJECTED" → closedAt set → reporter notified

ESCALATION (any stage)
  └─ POST /api/incidents/[id]/escalate
  └─ severity → CRITICAL → all admins notified → ESCALATED event logged
```

Valid transitions only (from `VALID_STATUS_TRANSITIONS` in types.ts):
```
NEW → ACKNOWLEDGED | REJECTED
ACKNOWLEDGED → IN_PROGRESS | REJECTED
IN_PROGRESS → RESOLVED | REJECTED
RESOLVED → CLOSED
```

---

## 4. DEPLOYMENT ROLLBACK

```
1. Identify the last working deployment URL from memory.md
2. vercel alias set <last-good-url> pecker-app.vercel.app
3. Diagnose broken deployment via: vercel logs <bad-url> --output raw
4. Fix → redeploy → re-alias
```

---

## 5. USER ROLE MANAGEMENT

```
New ADMIN needed:
  1. Existing admin logs in → /admin/users
  2. Find user → change role dropdown → ADMIN
  3. User must log out + back in (JWT refresh)

RESPONDER → RESIDENT demotion:
  Same path. Role takes effect on next login.

Mass seed (demo/testing):
  POST /api/seed  -H "Authorization: Bearer <SEED_SECRET>"
  Creates: 1 admin, 1 responder, 1 resident + 5 sample incidents
```

---

## 6. NEW PROJECT BOOTSTRAP (lessons from Pecker)

```
BEFORE writing any code:
  1. Pin Next.js to 16.2.7+
  2. Pin Tailwind to 3.4.17 (exact)
  3. Confirm Prisma + any adapter versions match
  4. Set DATABASE_URL on Vercel before first deploy
  5. Create .claude/ directory with engineering.md, memory.md, security.md

PRISMA SETUP:
  1. provider = "postgresql" in schema AND migration_lock.toml
  2. No directUrl unless using PgBouncer
  3. String fields, not Prisma enums
  4. globalThis singleton in db.ts

GIT SETUP:
  1. Confirm where git init ran (repo root)
  2. If project is a subdirectory — always stage with full relative paths
  3. Never git add -A from a monorepo root

VERCEL SETUP:
  1. vercel link (connect to project)
  2. Set all env vars before deploy
  3. Alias stable domain after first successful deploy
  4. Test API endpoints — build success ≠ runtime success
```
