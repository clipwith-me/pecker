# agents.md — Pecker Agent Architecture

## AGENT TYPES & RESPONSIBILITIES

### Planner Agent
**Role:** Breaks down features into ordered tasks. Checks for blockers before execution starts.  
**Input:** Feature description, current codebase state  
**Output:** Ordered task list with file paths, schema changes, API surface, test requirements  
**Permissions:** Read-only (files, schema, types)  
**Never:** Writes code, touches DB, deploys

### Research Agent
**Role:** Investigates errors, looks up library docs, finds root causes.  
**Input:** Error message, stack trace, library name + version  
**Output:** Root cause + fix with minimal code change  
**Permissions:** Read files, web search  
**Never:** Modifies production env vars, deploys

### Builder Agent
**Role:** Implements planned tasks. Writes code, runs local build, fixes TypeScript errors.  
**Input:** Task from Planner, file paths to touch  
**Output:** Working code, zero-error `npm run build`, passing tests  
**Permissions:** Full file write, run local commands, `npm install`  
**Never:** Deploys to production, modifies Vercel env vars

### Reviewer Agent
**Role:** Reviews diffs for correctness, RBAC gaps, missing Zod validation, type errors.  
**Input:** git diff or specific files  
**Output:** Findings list — severity HIGH/MED/LOW, specific line references  
**Permissions:** Read-only  
**Never:** Applies fixes directly — hands back to Builder

### Security Agent
**Role:** Audits auth flows, checks for privilege escalation paths, validates secret handling.  
**Input:** API routes, auth config, schema  
**Output:** Security findings with remediation  
**Permissions:** Read-only  
**Never:** Access to real credentials, production DB

### QA Agent
**Role:** Writes and runs tests. Verifies deployed endpoints.  
**Input:** API spec, component list, acceptance criteria  
**Output:** Test file, test results, API verification report  
**Permissions:** Read files, run `npm test`, call live API endpoints (GET/POST only)  
**Never:** Deploys, modifies DB, changes user roles

---

## AGENT COLLABORATION PATTERNS

### Feature build flow
```
User Request
  → Planner: break into tasks, identify files
  → Builder: implement, local build passes
  → Reviewer: check diff
  → Builder: fix findings
  → QA: write/run tests
  → Builder: deploy (vercel --prod --yes + alias)
  → QA: verify live endpoints
  → Planner: update memory.md
```

### Bug fix flow
```
Error report
  → Research: root cause + minimal fix
  → Builder: apply fix, verify locally
  → Reviewer: confirm fix doesn't break adjacent code
  → Builder: deploy
  → QA: verify fix on live URL
  → Document in engineering.md if pattern-level lesson
```

### Security review flow
```
Before any auth/RBAC change:
  → Security: review the change
  → Block deploy if HIGH severity finding unresolved
```

---

## APPROVAL SYSTEM

| Action | Required approval |
|--------|------------------|
| Schema change | Planner confirms no data loss |
| Role/permission change | Security Agent review |
| Deploying to production | Builder confirms zero build errors + tests pass |
| Rotating secrets | Manual — never agent-automated |
| Deleting data | Manual only — no agent |
| Changing RBAC rules | Security + Reviewer sign-off |

---

## AUDIT LOGGING

Every agent action in a session must be traceable via:
1. Git commit messages — describe what changed and why
2. `.claude/memory.md` — updated after each deploy session
3. `.claude/engineering.md` — updated when a new pattern/fix is discovered
4. Application `incident_events` table — runtime audit trail for all incident changes

---

## AGENT HANDOFF FORMAT

When passing work between agents, include:
```
CONTEXT: [what we're building / fixing]
STATE: [what's already done]
TASK: [exactly what this agent needs to do]
FILES: [specific file paths to read/modify]
CONSTRAINTS: [what must not change]
DONE WHEN: [acceptance criteria]
```

---

## FAILURE MODES & RECOVERY

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Builder introduces type error | `npm run build` fails | Revert file, re-read error, targeted fix |
| Deployer aliases wrong URL | Live site broken | `vercel alias set <last-good> pecker-app.vercel.app` |
| Agent stages wrong git files | Unexpected files in diff | `git reset HEAD <file>` before commit |
| Agent upgrades locked dependency | Build/runtime breaks | Revert `package.json` + `package-lock.json`, re-install |
| Agent removes Zod validation | Security gap | Reviewer catches; Builder restores before deploy |
| Agent uses `git add -A` in monorepo | Stages home directory | `git reset HEAD` immediately; re-stage explicit paths |
