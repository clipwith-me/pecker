# prompts.md — Pecker Prompt Infrastructure

## PROMPT DESIGN RULES

1. State the constraint before the task — never bury it at the end
2. Include the exact file paths — don't make the agent search
3. Specify "done when" criteria — removes ambiguity
4. Name what must NOT change — prevents regressions
5. One task per prompt — no compound instructions

---

## REUSABLE PROMPT MODULES

### [MODULE: CONTEXT-LOAD]
```
Project: Pecker — Community Incident Management Platform
Stack: Next.js 16.2.7, Prisma 5, Neon PostgreSQL, NextAuth v5, Tailwind v3
Live: https://pecker-app.vercel.app
Git root: C:\Users\HomePC (project at Desktop/Pecker)
Read .claude/engineering.md before making any code decisions.
```

### [MODULE: DEPLOY-SAFE]
```
Before touching any file, confirm:
- npm run build passes locally (zero TypeScript errors)
- All 37+ tests pass
- No Tailwind v4 classes used
- No prisma enum types used (use String fields)
- useForm<any> if Zod schema has .default() fields
```

### [MODULE: GIT-SAFE]
```
Git repo root is C:\Users\HomePC — NOT inside Desktop/Pecker.
All git commands must run from C:\Users\HomePC.
Stage files explicitly: git add Desktop/Pecker/<path>
NEVER use git add -A or git add .
```

### [MODULE: API-PATTERN]
```
Every API route must:
1. Parse body with Zod schema (return 400 on failure)
2. Check session with auth() (return 401 if missing)
3. Check role if restricted (return 403 if unauthorized)
4. Return { success: boolean, data?: T, error?: string }
5. Log audit event to incident_events if touching incident state
```

---

## TASK PROMPT TEMPLATES

### Add a new API endpoint
```
[MODULE: CONTEXT-LOAD]

Task: Add POST /api/incidents/[id]/reopen endpoint.

Files to create: src/app/api/incidents/[id]/reopen/route.ts
Files to read first: src/lib/types.ts, src/lib/validations.ts, src/lib/auth.ts

Requirements:
- Only ADMIN or RESPONDER can reopen
- Transition: CLOSED → NEW (add to VALID_STATUS_TRANSITIONS in types.ts)
- Log IncidentEvent with action: "REOPENED"
- Notify original reporter
- Return updated incident

[MODULE: API-PATTERN]
[MODULE: DEPLOY-SAFE]

Done when: npm run build passes, POST returns 200 with updated incident
```

### Fix a TypeScript build error
```
[MODULE: CONTEXT-LOAD]

Error: <paste exact TypeScript error>
File: <exact file path>
Line: <line number>

Fix the type error. Do not change any runtime behavior.
Do not upgrade any dependencies.
Do not change any other file unless the type error requires it.

Done when: npm run build passes with zero errors
```

### Add a new UI component
```
[MODULE: CONTEXT-LOAD]

Task: Create <ComponentName> component.

File: src/components/<path>/<ComponentName>.tsx

Design rules:
- Mobile-first (design for 375px width, enhance for larger)
- Tailwind v3 classes only (no v4 syntax)
- No inline styles
- Accept className prop and merge with cn()
- Export as named export

Props: <list props>
Behavior: <describe>

Done when: component renders correctly on mobile and desktop
```

### Deploy a fix
```
[MODULE: CONTEXT-LOAD]
[MODULE: GIT-SAFE]

Deploy the following changed files to production:
- <file1>
- <file2>

Steps:
1. Confirm npm run build passes
2. Stage files explicitly from C:\Users\HomePC
3. Commit with message: "<message>"
4. cd Desktop/Pecker && vercel --prod --yes
5. Copy new deployment URL
6. vercel alias set <new-url> pecker-app.vercel.app
7. Test: POST https://pecker-app.vercel.app/api/auth/register with test payload
8. Update .claude/memory.md with new deployment URL

Done when: live URL returns 201 on registration test
```

### Debug a production 500
```
[MODULE: CONTEXT-LOAD]

The endpoint POST /api/<route> is returning 500 on https://pecker-app.vercel.app.

Steps:
1. Run: vercel logs <last-deployment-url> --output raw
2. Find the ERROR line — report exact message
3. Cross-reference with src/app/api/<route>/route.ts
4. Identify root cause (missing env var / DB connection / type mismatch / schema mismatch)
5. Propose minimal fix

Do not guess. Read the logs first.
```

---

## PROMPT VERSIONING

When a prompt template is updated, note the change inline:
```
# v2 — 2026-06-08 — added [MODULE: GIT-SAFE] after staging incident
```

Old versions are not deleted — they're commented out with date and reason.

---

## ANTI-PATTERNS (NEVER USE)

| Bad prompt | Problem | Fix |
|------------|---------|-----|
| "Fix the bug" | No context, no file | Include error + file path |
| "Make it better" | Undefined scope | Define specific metric |
| "Update all files" | Uncontrolled blast radius | List exact files |
| "Deploy when ready" | No verification step | Require build + test pass |
| "Do it like before" | Relies on memory drift | Always include explicit spec |
| "Upgrade dependencies first" | Breaks locked stack | Never upgrade without testing |
