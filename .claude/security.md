# security.md — Pecker Security OS

## DATA CLASSIFICATION

| Class | Examples | Storage Rule |
|-------|----------|-------------|
| SECRET | NEXTAUTH_SECRET, DB passwords, BLOB tokens | Vercel env only. Never in code, logs, or git |
| SENSITIVE | User emails, phone numbers, passwords | DB only. Never in API responses (omit passwordHash) |
| INTERNAL | Incident details, notes, audit trail | Authenticated endpoints only |
| PUBLIC | Incident category labels, status names | Safe to expose in client bundle |

---

## AUTHENTICATION & AUTHORIZATION

### Session model
- JWT sessions via NextAuth v5 — no DB session table
- Token contains: `id`, `email`, `name`, `role`
- Token lifetime: 30 days (default NextAuth)
- Role embedded in token — role changes require re-login to take effect

### RBAC enforcement — every protected API route must:
```typescript
const session = await auth();
if (!session?.user) return 401;
if (requiredRole && session.user.role !== requiredRole) return 403;
```

### Role escalation prevention
- `/api/auth/register` only accepts `RESIDENT` or `RESPONDER` — never `ADMIN`
- Admin promotion exclusively via `/api/users/[id]` — requires `ADMIN` session
- Zod schema on register: `role: z.enum(["RESIDENT", "RESPONDER"])`

### Password rules
- bcrypt cost factor: 12
- Minimum: 8 chars, 1 uppercase, 1 number (enforced by Zod + UI)
- Never returned in any API response
- Never logged

---

## API SECURITY

### Input validation
Every API route validates body against a Zod schema before any DB operation.  
Reject with `400` on parse failure — never pass raw user input to Prisma.

### Seed endpoint protection
`/api/seed` requires: `Authorization: Bearer <SEED_SECRET>`  
`SEED_SECRET` is a Vercel env var. Rotate after hackathon demos.

### Upload endpoint
- File type validated before write (images only)
- Max size enforced at upload handler
- In prod: writes to Vercel Blob (isolated, CDN-served)
- In dev: writes to `public/uploads/` (excluded from `.vercelignore`)

### Status transitions
All status changes validated against `VALID_STATUS_TRANSITIONS` map.  
Prevents arbitrary state jumps (e.g. NEW → CLOSED without going through workflow).

---

## SECRETS MANAGEMENT

### Never do
- Commit `.env` to git (it's in `.gitignore`)
- Hard-code secrets in source files
- Log `DATABASE_URL` or any token
- Expose `NEXTAUTH_SECRET` client-side

### Vercel env var setup
```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add SEED_SECRET production
vercel env add BLOB_READ_WRITE_TOKEN production
```

### Secret rotation
| Secret | When to rotate |
|--------|---------------|
| NEXTAUTH_SECRET | If session compromise suspected; rotates all sessions |
| DATABASE_URL password | Annually or on breach |
| SEED_SECRET | After each public demo |
| BLOB_READ_WRITE_TOKEN | Annually or on breach |

---

## AUDIT TRAIL

Every incident state change, assignment, escalation, and note is written to `incident_events` with:
- `actorId` — who did it
- `action` — what happened
- `fromStatus` / `toStatus` — state delta
- `note` — optional context
- `createdAt` — immutable timestamp

Audit events are append-only — no update or delete on `incident_events`.

---

## AGENT PERMISSION LEVELS

| Agent type | DB access | Can write? | Can deploy? |
|------------|-----------|-----------|-------------|
| Read-only researcher | SELECT only | No | No |
| Builder (Claude Code) | Full local | Yes (code files) | No |
| Deploy agent | No DB | No | Yes (vercel CLI) |
| Admin agent | Full | Yes | Yes |

No agent should hold `NEXTAUTH_SECRET` or `BLOB_READ_WRITE_TOKEN` in memory beyond the task.

---

## FAILURE PREVENTION

| Failure | Prevention |
|---------|------------|
| Mass data exposure | RBAC on every route; no wildcard selects without auth |
| SQL injection | Prisma parameterized queries — never raw SQL with user input |
| XSS | Next.js escapes JSX by default; no `dangerouslySetInnerHTML` |
| CSRF | NextAuth CSRF protection on mutation endpoints |
| Privilege escalation | Register endpoint blocks ADMIN role; Zod enum enforced |
| Broken access control | Incident ownership checked before PATCH/DELETE |
