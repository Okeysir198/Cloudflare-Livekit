# Quick Start Guide

Get your LiveKit Voice Agent running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account (free)

## 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

## 2. Set Up Database

```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create livekit-conversations

# Copy the database_id from output and update wrangler.toml

# Apply schema
wrangler d1 execute livekit-conversations --file=./sql/schema.sql

# Generate password hashes
node scripts/generate-hash.js admin123
node scripts/generate-hash.js demo123

# Update sql/seed.sql with the generated hashes

# Seed database
wrangler d1 execute livekit-conversations --file=./sql/seed.sql
```

## 3. Configure Environment

Create `.dev.vars`:

```env
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_WS_URL=wss://your-livekit-server.com
```

## 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

Login with:
- **Admin:** `admin` / `admin123`
- **Demo:** `demo` / `demo123`

## 5. Deploy to Cloudflare

```bash
# Build
npm run pages:build

# Deploy
wrangler pages deploy .vercel/output/static

# Set secrets
wrangler pages secret put JWT_SECRET
wrangler pages secret put LIVEKIT_API_KEY
wrangler pages secret put LIVEKIT_API_SECRET
wrangler pages secret put LIVEKIT_WS_URL
```

In Cloudflare Dashboard → Pages → Your Project → Settings → Functions:
- Add D1 binding: `DB` → `livekit-conversations`

## Done! 🎉

Your app is now live on Cloudflare Pages!

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
