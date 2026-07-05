# memory.md — Pecker Project Memory

## MEMORY LAYERS

### Permanent (never delete)
Architectural decisions, stack locks, fixed bugs with root cause + solution.  
Lives in: `CLAUDE.md`, `.claude/engineering.md`, `.claude/security.md`

### Operational (update each session)
Current deployment state, pending tasks, open issues.  
Lives in: this file (sections below)

### Temporary (discard after session)
Intermediate command outputs, build log snippets, test URLs.  
Never write to files.

---

## CURRENT STATE

**Last deployed:** 2026-06-08  
**Live URL:** https://pecker-app.vercel.app  
**Last deployment URL:** pecker-7yebc11yw-clipwith-mes-projects.vercel.app  
**DB:** Neon PostgreSQL — schema pushed, demo data seeded  
**Build:** clean — 26 routes, 0 TypeScript errors  
**Tests:** 37 passing

---

## KNOWN ISSUES

| Issue | Status | Notes |
|-------|--------|-------|
| /api/* returning 500 on Vercel | Investigating | Neon adapter removed; plain PrismaClient in use. Re-test after each deploy |
| Vercel Blob not wired | Pending | BLOB_READ_WRITE_TOKEN not set → upload falls back to local FS, fails in prod |
| No GitHub remote | Pending | git remote not configured; user must do manually |

---

## COMPLETED DECISIONS (DO NOT REVISIT)

- Tailwind v3.4.17 — pinned, do not upgrade
- Next.js 16.2.7 — minimum viable version on Vercel
- No @prisma/adapter-neon — version incompatible with Prisma 5
- No `directUrl` in schema — causes Vercel build failure
- `migration_lock.toml` = "postgresql" — already fixed
- `useForm<any>` for role field — already fixed
- `turbopack: { root: __dirname }` — already in next.config.ts

---

## NEXT ACTIONS (ORDERED)

1. **Verify API** — test `/api/auth/register` returns 201 on live URL
2. **Set BLOB_READ_WRITE_TOKEN** — Vercel dashboard → Storage → Blob → create store → env var auto-added
3. **Push to GitHub** — user runs manually:
   ```bash
   git remote add origin https://github.com/<user>/pecker.git
   git push -u origin main   # run from C:\Users\HomePC
   ```
4. **Promote admin user** — seed creates demo admin; or use /admin/users to promote
5. **Custom domain** (optional) — Vercel dashboard → Domains

---

## DEMO CREDENTIALS (seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pecker.com | Admin@1234 |
| Responder | responder@pecker.com | Responder@1234 |
| Resident | resident@pecker.com | Resident@1234 |

---

## MEMORY UPDATE RULES

After every session update this file:
- Change **CURRENT STATE** to reflect last deploy URL and build status
- Move completed NEXT ACTIONS to COMPLETED DECISIONS
- Add any new KNOWN ISSUES discovered
- Never duplicate content already in `engineering.md`
