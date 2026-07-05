# Contributing to Pecker

Thank you for taking the time to contribute. Pecker is a community-driven project and every contribution — no matter how small — makes a real difference for the communities that depend on this platform.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Format](#commit-message-format)

---

## Code of Conduct

By participating in this project you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## How Can I Contribute?

### Reporting Bugs

Before opening a bug report, please check if an [existing issue](https://github.com/clipwith-me/pecker/issues) already covers it.

When filing a bug report, include:
- A clear title and description
- Steps to reproduce the behaviour
- What you expected to happen
- What actually happened
- Your environment (browser, OS, screen size)
- Screenshots or recordings if relevant

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Features

Feature requests are welcome. Check the [existing issues](https://github.com/clipwith-me/pecker/issues) first to avoid duplicates.

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and explain:
- The problem your feature solves
- Who it benefits (residents, responders, admins, the public)
- How you imagine it working

### Improving Documentation

Documentation improvements — typo fixes, clearer explanations, new examples — are always welcome and can be submitted directly as a pull request without opening an issue first.

### Writing Code

Look for issues labelled `good first issue` or `help wanted`. Leave a comment on the issue before starting work so we can coordinate and avoid duplicate effort.

---

## Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/pecker.git
cd pecker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# Push database schema
npx prisma db push

# Start development server
npm run dev

# Run tests
npm test
```

---

## Pull Request Process

1. **Create a branch** from `main` with a descriptive name:
   - `fix/notification-badge-count`
   - `feat/incident-comments`
   - `docs/api-reference`

2. **Make your changes** — keep them focused. One PR per feature or fix.

3. **Write or update tests** if your change affects behaviour.

4. **Run the test suite** before pushing:
   ```bash
   npm test
   npm run build
   ```

5. **Open a Pull Request** against `main`:
   - Fill in the PR template completely
   - Link the related issue (`Closes #123`)
   - Add screenshots for UI changes

6. **Address review feedback** promptly. PRs with no activity for 14 days may be closed.

7. Once approved, a maintainer will merge your PR.

---

## Coding Standards

- **TypeScript** — no `any` unless genuinely unavoidable (add a comment explaining why)
- **Tailwind CSS** — use existing utility classes; avoid arbitrary values where a standard value exists
- **API routes** — all inputs must be validated with the Zod schemas in `src/lib/validations.ts`
- **RBAC** — every API route must check `session.user.role` before performing any privileged operation
- **No comments** unless the WHY is non-obvious. Code should be self-documenting.
- **No console.log** in production paths

---

## Commit Message Format

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short description>

[optional body]
```

Types:
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `style` — formatting, no logic change
- `refactor` — code change that neither fixes a bug nor adds a feature
- `test` — adding or fixing tests
- `chore` — build, tooling, dependencies

Examples:
```
feat: add incident comment threads
fix: responder geo-filter excludes incidents with null city
docs: add API reference to README
```

---

## Questions?

Open a [GitHub Discussion](https://github.com/clipwith-me/pecker/discussions) or reach out via the [Support page](https://pecker-app.vercel.app/support).
