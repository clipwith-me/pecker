# engineering.md — Pecker Engineering OS

## STACK CONTRACTS

| Layer | Choice | Locked version | Reason |
|-------|--------|----------------|--------|
| Framework | Next.js | 16.2.7 | CVE policy blocks <16 on Vercel |
| CSS | Tailwind CSS | 3.4.17 (exact) | v4 breaks all v3 patterns |
| ORM | Prisma | 5.22.0 | adapter-neon v7 needs Prisma v7 |
| Auth | NextAuth | 5.0.0-beta.25 | v5 JWT + RBAC callbacks |
| DB | Neon PostgreSQL | — | serverless-safe with timeout params |
| Blob | Vercel Blob | 2.4.0 | prod uploads; local FS fallback in dev |

**Never upgrade Tailwind to v4** without rewriting all component styles.  
**Never upgrade @prisma/adapter-neon** without matching Prisma major version.

---

## DATABASE RULES

### Schema
- All enum-like fields are `String` in Prisma schema. No native Prisma enums.
- Zod validates allowed string values at the API boundary.
- `migration_lock.toml` must always say `provider = "postgresql"`.
- Use `prisma db push` on new databases (skips migration history conflicts).
- No `directUrl` unless explicitly using PgBouncer.

### Connection string (Neon serverless)
```
postgresql://user:pass@host/db?sslmode=require&connect_timeout=15&pool_timeout=15&connection_limit=5
```

### Singleton pattern (required — prevents hot-reload pool exhaustion)
```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = g.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

---

## TYPESCRIPT RULES

### Form typing with Zod `.default()`
When a Zod field uses `.default()`, the input and output types diverge. `useForm<ZodType>` breaks the `Resolver` generic.

```typescript
// WRONG — causes "undefined not assignable to 'RESIDENT' | 'RESPONDER'"
useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

// CORRECT
useForm<any>({ resolver: zodResolver(registerSchema), defaultValues: { role: "RESIDENT" } })

// Error message rendering — must cast
{errors.field && <p>{String(errors.field.message ?? "")}</p>}
```

### Prisma-generated types vs custom types
Prisma does not generate enum types when schema fields are `String`.  
Define role/status/category types in `src/lib/types.ts` and import from there.

```typescript
// src/lib/types.ts
export type Role = "RESIDENT" | "RESPONDER" | "ADMIN";
export type IncidentStatus = "NEW" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";
```

### Import guard
Never `import { Role } from "@prisma/client"` — it won't exist.  
Always `import type { Role } from "@/lib/types"`.

---

## NEXT.JS RULES

### next.config.ts (v16)
```typescript
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },   // required if parent dir has package-lock.json
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};
```

Removed in v16 (will throw config validation error if present):
- `experimental.serverActions`
- `experimental.appDir`

### Turbopack root
If the project lives in a subdirectory of a node repo (e.g. `C:\Users\HomePC\Desktop\Pecker` inside `C:\Users\HomePC` which has its own `package-lock.json`), Turbopack gets confused.  
Fix: `turbopack: { root: __dirname }` in next.config.ts.

---

## VERCEL DEPLOYMENT RULES

### Deploy flow
```bash
vercel --prod --yes
# copy the new unique URL from output
vercel alias set <new-unique-url> pecker-app.vercel.app
```

### Env vars to set before first deploy
```
DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL, SEED_SECRET
```
Optional (enables photo uploads): `BLOB_READ_WRITE_TOKEN`

### Debugging 500 errors on Vercel
Build success ≠ runtime success. Always test APIs after aliasing:
```powershell
Invoke-WebRequest "https://pecker-app.vercel.app/api/auth/register" `
  -Method POST -ContentType "application/json" `
  -Body '{"name":"T","email":"t@t.com","password":"Test@1234","role":"RESIDENT"}' `
  -UseBasicParsing
```
Check function logs: `vercel logs <deployment-url> --output raw`

### .vercelignore
```
.next
node_modules
prisma/dev.db
public/uploads
coverage
test-results
```

---

## GIT RULES (REPO ROOT ≠ PROJECT DIR)

The git repo is initialized at `C:\Users\HomePC`, not inside `Desktop/Pecker`.

```powershell
# ALWAYS run from repo root
cd "C:\Users\HomePC"

# Stage specific files — NEVER use git add -A or git add .
git add Desktop/Pecker/src/lib/db.ts Desktop/Pecker/prisma/schema.prisma
git commit -m "description"
```

`git add -A` from this location would stage the entire home directory.

---

## API DESIGN PATTERNS

### Auth check pattern
```typescript
const session = await auth();
if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
if (session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
```

### Response envelope
All API routes return: `{ success: boolean, data?: T, error?: string }`

### Status transition guard
Use `VALID_STATUS_TRANSITIONS` map from `src/lib/types.ts` — never allow arbitrary status jumps.

---

## TEST COVERAGE (37 passing)

- Unit: Zod validation schemas
- Unit: status transition logic
- Unit: RBAC permission checks
- Component: IncidentCard, StatusBadge, PeckerLogo
- Component: ReportWizard step rendering
- Integration: API route handlers (mocked Prisma)

Run: `npm test`  
Config: `jest.config.js` + `babel.config.js` (not ts-jest — uses Babel for speed)
