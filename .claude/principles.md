# principles.md — Pecker Engineering Principles

## CORE PRINCIPLES

### 1. Build once, verify twice
Every change is verified locally (build + tests) AND in production (live endpoint test).  
A green Vercel build log is not verification. An API response is.

### 2. Lock the stack, own the risk
Versions are locked because they're known to work together.  
Upgrading a dependency is a feature, not a maintenance task — plan and test it explicitly.  
Default answer to "should I upgrade X?" is no.

### 3. Explicit over implicit
Explicit file paths in git staging. Explicit role checks in every API route. Explicit type casts on form errors.  
Implicit assumptions (git add ., useForm<T>, import from @prisma/client) caused every build failure in this project.

### 4. Fail loud, fail early
TypeScript strict mode. Zod on all API inputs. `npm run build` must pass before any commit.  
A runtime error in production that could have been a compile error is a process failure.

### 5. Minimal blast radius
Every code change touches the fewest possible files.  
Every git commit stages the fewest possible files.  
Every dependency change is isolated and tested before the next one.

### 6. Document the fix, not just the symptom
When a bug is fixed, the root cause and fix pattern go into `.claude/engineering.md`.  
The goal is that the same issue is never diagnosed twice.

### 7. Mobile-first is not optional
Every UI component is designed at 375px width first.  
Desktop layout is an enhancement, not the base.  
The 60-second incident report flow is the core user experience.

### 8. Security is not a layer, it's the frame
RBAC checks are not added after the fact. They are the first lines of every API handler.  
No secret ever touches a log, a code comment, or a git commit.

---

## WHAT GOOD LOOKS LIKE

**Good PR:** Single responsibility. Zero TypeScript errors. Tests updated. Deployment verified. memory.md updated.

**Good API route:** Zod parse → auth check → role check → DB op → audit log → response envelope.

**Good commit:** Staged explicit files. Message describes the "why" not just the "what". Deployed and verified before closing the task.

**Good incident report UI:** Works in one hand on a phone. Location captured automatically. Photo attached without friction. Submitted in under 60 seconds.

---

## WHAT BAD LOOKS LIKE

**Bad:** `git add -A` from the home directory.  
**Bad:** Upgrading Tailwind and "seeing if it works."  
**Bad:** Deploying without running `npm run build` first.  
**Bad:** Calling an API endpoint "fixed" because the build passed.  
**Bad:** Adding `// @ts-ignore` to suppress a real type error.  
**Bad:** Hardcoding a secret to "just get it working."  
**Bad:** `useForm<RegisterInput>` with a Zod schema that has `.default()` fields.  
**Bad:** Importing `Role` from `@prisma/client` when no Prisma enum exists.

---

## DECISION FRAMEWORK

When facing a technical choice, answer in order:

1. **Does `.claude/engineering.md` already document this?** → follow it
2. **Will this change require touching the locked stack?** → default no; justify if yes
3. **What's the smallest change that solves the problem?** → do that
4. **Can the change be verified before deploy?** → `npm run build` + `npm test`
5. **Does this change have security implications?** → read `.claude/security.md`
6. **Will future-me understand why this decision was made?** → document it if not
