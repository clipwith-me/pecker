# Pecker — Deployment Guide

## ✅ Live URL: https://pecker-app.vercel.app

## One-Time Setup (do this once)

### 1. Create GitHub Repository
Go to https://github.com/new and create a repo called `pecker` (public), then run:

```bash
cd "C:\Users\HomePC\Desktop\Pecker"
git init -b main
git remote add origin https://github.com/YOUR_USERNAME/pecker.git
git push -u origin main
```

### 2. Create Neon PostgreSQL (free)
1. Go to https://neon.tech and sign up (free)
2. Create a new project called "pecker"
3. Copy two connection strings from the dashboard:
   - **Connection string** → your `DATABASE_URL` (pooled, starts with `postgres://`)
   - **Direct connection** → your `DIRECT_URL` (non-pooled, starts with `postgres://`)

### 3. Deploy to Vercel
```bash
cd "C:\Users\HomePC\Desktop\Pecker"
vercel login          # opens browser, log in with GitHub/email
vercel --prod         # deploys and gives you the live URL
```

When prompted:
- Set up and deploy? **Y**
- Which scope? → your account
- Link to existing project? **N** (create new)
- Project name: **pecker**
- Directory: **./**

### 4. Set Environment Variables on Vercel
Go to https://vercel.com/dashboard → your project → **Settings** → **Environment Variables**
Add these:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon **pooled** connection string |
| `DIRECT_URL` | Your Neon **direct** connection string |
| `NEXTAUTH_SECRET` | Any random 32+ char string (generate: `openssl rand -hex 32`) |
| `NEXTAUTH_URL` | `https://pecker-app.vercel.app` ✅ already set |
| `NEXT_PUBLIC_APP_URL` | `https://pecker-app.vercel.app` ✅ already set |
| `SEED_SECRET` | Any secret string, e.g. `pecker-seed-2025` |

Then click **Redeploy** to apply.

### 5. Run Database Migration + Seed
After deploy, in Vercel dashboard → **Functions** tab, OR run locally:
```bash
# Migrate the production DB (run once)
DATABASE_URL="your-neon-direct-url" npx prisma migrate deploy

# Seed demo data (call the API endpoint)
curl -X POST https://your-app.vercel.app/api/seed \
  -H "Authorization: Bearer pecker-seed-2025"
```

### 6. Set up Vercel Blob (for image uploads)
In Vercel dashboard → **Storage** tab → **Create Database** → **Blob**
Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your env.

---

## Test Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pecker.com | Admin@1234 |
| Responder | responder@pecker.com | Resp@1234 |
| Resident | jane@example.com | User@1234 |

---

## Local Development
```bash
npm run dev          # http://localhost:3000
npm run db:studio    # Prisma Studio (database browser)
npm test             # run test suite
```
