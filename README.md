<div align="center">
  <img src="public/pecker-logo.svg" alt="Pecker Logo" width="80" />
  <h1>Pecker</h1>
  <p><strong>Community Incident Management Platform</strong></p>
  <p>Report, track, and resolve every estate, campus, or municipal problem in under 60 seconds.</p>

  <p>
    <a href="https://pecker-app.vercel.app"><img src="https://img.shields.io/badge/Live-pecker--app.vercel.app-4F46E5?style=flat-square&logo=vercel" alt="Live App" /></a>
    <a href="https://github.com/clipwith-me/pecker/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" /></a>
    <a href="https://github.com/clipwith-me/pecker/issues"><img src="https://img.shields.io/github/issues/clipwith-me/pecker?style=flat-square" alt="Open Issues" /></a>
    <a href="https://github.com/clipwith-me/pecker/pulls"><img src="https://img.shields.io/github/issues-pr/clipwith-me/pecker?style=flat-square" alt="Pull Requests" /></a>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  </p>

  <p>
    <a href="https://pecker-app.vercel.app">Live Demo</a> ·
    <a href="https://pecker-app.vercel.app/map">Public Map</a> ·
    <a href="https://github.com/clipwith-me/pecker/issues/new?template=bug_report.md">Report Bug</a> ·
    <a href="https://github.com/clipwith-me/pecker/issues/new?template=feature_request.md">Request Feature</a> ·
    <a href="https://ko-fi.com/Pecker">Support the Project</a>
  </p>
</div>

---

## What is Pecker?

Pecker replaces community WhatsApp complaint groups with a structured, trackable, accountable incident management platform. When residents report a broken streetlight, flooding, security threat, or road damage, the report is automatically routed to the right response team — and tracked until it is resolved.

**The problem:** Complaints get buried in group chats. Nobody knows who is responsible. Urgent issues compete with trivial ones. Residents lose trust.

**The solution:** A platform where every incident has an owner, a status, a timeline, and a public record.

---

## Screenshots

| Public Map | Incident Reporting | Admin Dashboard |
|---|---|---|
| Real-time incident map, no login required | 5-step mobile wizard in under 60s | KPIs, assignments, and escalations |

---

## Features

- **5-step mobile reporting** — Category → describe → GPS → photo/video → submit in 60s
- **Live incident map** — MapLibre GL, OpenFreeMap tiles, clustered pins, 4 styles
- **Global location search** — Search any city or estate worldwide via Nominatim
- **6-state lifecycle** — NEW → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED → REJECTED
- **Responder geo-scoping** — Responders only see incidents from their city/community
- **Community upvoting** — Residents +1 incidents they're also affected by
- **Video evidence** — Record up to 30s in-browser, no app download
- **Anonymous reporting** — For sensitive security and social issues
- **SLA timers** — Warning at 24h, overdue at 72h, visible on every card
- **Escalation** — Bump any incident to CRITICAL, notifies all admins instantly
- **Immutable audit trail** — Every action, actor, and timestamp permanently recorded
- **Admin dashboard** — KPIs, category breakdowns, resolution rate, backlog
- **CSV export** — Download all incidents for compliance or council meetings
- **AI category suggestion** — Suggests the right category as you type the title
- **Real-time notifications** — Unread badge, 30-second polling
- **Shareable incident URLs** — Public `/i/[id]` link, no login required
- **Full RBAC** — RESIDENT, RESPONDER, ADMIN with server-enforced permissions
- **Open source** — MIT licensed, free forever

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · TypeScript |
| Styling | Tailwind CSS v3 · Radix UI primitives |
| Auth | NextAuth.js v5 (JWT + RBAC) |
| Database | Prisma 5 ORM · Neon PostgreSQL (serverless) |
| File storage | Vercel Blob (prod) · Local FS (dev) |
| Map | MapLibre GL JS · OpenFreeMap tiles · Nominatim |
| State | TanStack Query · Zustand |
| Testing | Jest · Testing Library |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/clipwith-me/pecker.git
cd pecker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values — see Environment Variables below

# 4. Push the database schema
npx prisma db push

# 5. (Optional) Seed demo data
npm run dev
# then in another terminal:
curl -X POST http://localhost:3000/api/seed \
  -H "Authorization: Bearer your_seed_secret"

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"          # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Seed API protection
SEED_SECRET="any-string-you-choose"

# File uploads (Vercel Blob — optional for dev)
BLOB_READ_WRITE_TOKEN=""
```

### Test Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@pecker.com | Admin@1234 |
| Responder | responder@pecker.com | Resp@1234 |
| Resident | jane@example.com | User@1234 |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| GET | `/api/incidents` | Required | List incidents (role-filtered) |
| POST | `/api/incidents` | Required / Guest | Create incident |
| GET | `/api/incidents/[id]` | Required | Get incident detail |
| PATCH | `/api/incidents/[id]` | RESPONDER+ | Update incident |
| PATCH | `/api/incidents/[id]/status` | RESPONDER+ | Change lifecycle status |
| PATCH | `/api/incidents/[id]/assign` | RESPONDER+ | Assign to responder |
| POST | `/api/incidents/[id]/escalate` | RESPONDER+ | Escalate to CRITICAL |
| POST | `/api/incidents/[id]/note` | RESPONDER+ | Add audit note |
| POST | `/api/incidents/[id]/vote` | RESIDENT+ | Toggle upvote |
| GET | `/api/incidents/export` | RESPONDER+ | Download CSV |
| GET | `/api/map` | Public | Map incident data |
| GET | `/api/dashboard/stats` | ADMIN | KPI aggregates |
| GET | `/api/notifications` | Required | List notifications |
| PATCH | `/api/notifications` | Required | Mark as read |
| POST | `/api/upload` | Required | Upload image/video |
| GET | `/api/users` | RESPONDER+ | List users |
| PATCH | `/api/users` | ADMIN | Update role / location |

---

## Contributing

We welcome contributions of all kinds — bug fixes, new features, documentation, translations, and design improvements.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to your branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## Security

If you discover a security vulnerability, please **do not open a public issue**. Read our [Security Policy](SECURITY.md) for responsible disclosure instructions.

---

## Supporting Pecker

Pecker is free and open source. If it helps your community, please consider supporting the infrastructure costs:

- ☕ [Ko-fi](https://ko-fi.com/Pecker) — one-time or monthly tip
- 🌍 [Open Collective](https://opencollective.com/peckersolve) — transparent, community-backed giving

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for full details.

---

## Acknowledgements

- [MapLibre GL JS](https://maplibre.org/) — open-source map rendering
- [OpenFreeMap](https://openfreemap.org/) — free vector map tiles
- [Nominatim / OpenStreetMap](https://nominatim.org/) — geocoding and reverse geocoding
- [Neon](https://neon.tech) — serverless PostgreSQL
- [Vercel](https://vercel.com) — hosting and blob storage

---

<div align="center">
  <sub>Built with ❤️ for communities everywhere · <a href="https://pecker-app.vercel.app">pecker-app.vercel.app</a></sub>
</div>
