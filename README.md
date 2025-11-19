# LiveKit Voice Agent on Cloudflare

A full-stack voice AI application built with LiveKit, Next.js, and Cloudflare (D1, Pages, Workers). Features include user authentication, conversation storage, and real-time voice interactions with AI agents.

## Features

- ✅ **User Authentication** (Admin + Demo roles with JWT)
- ✅ **LiveKit Integration** (Real-time voice & video)
- ✅ **Conversation Storage** (D1 SQLite database)
- ✅ **Role-Based Access Control** (RBAC)
- ✅ **Cloudflare Free Tier** (Zero cost deployment)
- ✅ **Next.js 15** (App Router, Edge Runtime)
- ✅ **TypeScript** (Full type safety)
- ✅ **Tailwind CSS** (Modern UI)

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **LiveKit React SDK** - Voice/video components

### Backend
- **Cloudflare Pages** - Frontend hosting
- **Cloudflare Workers** - Edge API routes
- **Cloudflare D1** - SQLite database
- **LiveKit Server SDK** - Token generation
- **jose** - JWT authentication (Edge Runtime)
- **bcrypt-edge** - Password hashing (Edge Runtime)

### External
- **LiveKit Server** - WebRTC SFU (self-hosted)
- **LiveKit Python Agent** - Voice AI agent (self-hosted)

## Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── token/         # LiveKit token generation
│   │   ├── sessions/      # Session management
│   │   └── conversations/ # Conversation CRUD
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── providers/         # React context providers
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database helpers
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # General utilities
├── sql/
│   ├── schema.sql        # Database schema
│   └── seed.sql          # Seed data
├── scripts/              # Utility scripts
├── wrangler.toml         # Cloudflare configuration
├── next.config.ts        # Next.js configuration
└── package.json          # Dependencies
```

## Quick Start

### 1. Prerequisites

- **Node.js** 18+ and **npm/pnpm**
- **Wrangler CLI** (Cloudflare)
- **LiveKit Server** (running on your private server)
- **Cloudflare Account** (free tier)

### 2. Clone & Install

```bash
git clone <repository-url>
cd Cloudflare-Livekit
pnpm install
```

### 3. Create D1 Database

```bash
# Create database
pnpm run db:create

# Note the database_id from output, update wrangler.toml

# Apply schema
pnpm run db:schema

# Generate password hashes for seed data
node scripts/generate-hash.js admin123
node scripts/generate-hash.js demo123

# Update sql/seed.sql with the generated hashes

# Apply seed data
pnpm run db:seed
```

### 4. Configure Environment

Copy `.dev.vars.example` to `.dev.vars` and fill in your values:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```env
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_WS_URL=wss://your-livekit-server.com
```

### 5. Local Development

```bash
# Start Next.js dev server
pnpm dev
```

Visit `http://localhost:3000`

**Default login credentials:**
- Admin: `admin` / `admin123`
- Demo: `demo` / `demo123`

## Deployment

### Deploy to Cloudflare Pages

#### Option 1: Git Integration (Recommended)

1. Push code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
3. Click "Create a project" → "Connect to Git"
4. Select your repository
5. Build settings:
   - **Build command:** `pnpm pages:build`
   - **Build output:** `.vercel/output/static`
6. Add environment variables:
   - `JWT_SECRET`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `LIVEKIT_WS_URL`
7. In Settings → Functions → D1 database bindings:
   - Add binding: `DB` → Your D1 database
8. Deploy!

#### Option 2: CLI Deployment

```bash
# Build for production
pnpm pages:build

# Deploy
wrangler pages deploy .vercel/output/static --project-name=livekit-voice-agent

# Set secrets
wrangler pages secret put JWT_SECRET
wrangler pages secret put LIVEKIT_API_KEY
wrangler pages secret put LIVEKIT_API_SECRET
wrangler pages secret put LIVEKIT_WS_URL
```

### Configure D1 Binding

In Cloudflare Dashboard:
1. Pages → Your Project → Settings → Functions
2. D1 database bindings → Add binding
3. Variable name: `DB`
4. D1 database: Select your database
5. Save

## Database Management

```bash
# Create database
pnpm run db:create

# Apply schema (production)
pnpm run db:schema

# Apply schema (local)
pnpm run db:schema:local

# Seed data (production)
pnpm run db:seed

# Seed data (local)
pnpm run db:seed:local

# Generate password hash
node scripts/generate-hash.js <password>
```

## User Roles & Permissions

| Feature | Admin | Demo |
|---------|-------|------|
| Conversations | Unlimited | Max 10 |
| Messages per conversation | Unlimited | Max 100 |
| View all conversations | ✅ | ❌ |
| Delete any conversation | ✅ | ❌ |
| Export conversations | ✅ | ❌ |
| Manage users | ✅ | ❌ |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create user (admin only)
- `GET /api/auth/me` - Get current user

### LiveKit
- `POST /api/token` - Generate LiveKit access token

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `PATCH /api/sessions/:id` - End session

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id` - Get conversation
- `PATCH /api/conversations/:id` - Update conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Messages
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Save message

## Cloudflare Free Tier Limits

| Resource | Free Tier Limit | Estimated Usage |
|----------|----------------|-----------------|
| **D1 Rows Read** | 5M / day | ~3K / day ✅ |
| **D1 Rows Written** | 100K / day | ~8K / day ✅ |
| **D1 Storage** | 5 GB | ~130 MB ✅ |
| **Workers Requests** | 100K / day | ~10K / day ✅ |
| **Pages Builds** | 500 / month | ~30 / month ✅ |

**Monthly Cost: $0** 🎉

## Environment Variables

### Required

- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)
- `LIVEKIT_API_KEY` - LiveKit API key
- `LIVEKIT_API_SECRET` - LiveKit API secret
- `LIVEKIT_WS_URL` - LiveKit WebSocket URL

### Optional

- `NEXT_PUBLIC_APP_URL` - Application URL (for redirects)

## Security Best Practices

1. **Change default passwords** - Update `sql/seed.sql` with strong passwords
2. **Use strong JWT secret** - Minimum 32 random characters
3. **Enable HTTPS** - Always use secure connections
4. **Rate limiting** - Consider Cloudflare's rate limiting for login endpoints
5. **Regular backups** - Export D1 database regularly
6. **Monitor logs** - Check audit_log table for suspicious activity

## Troubleshooting

### Build fails with "Module not found"

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
pnpm install
```

### D1 database not accessible

1. Check `wrangler.toml` has correct `database_id`
2. Verify D1 binding in Cloudflare Pages settings
3. Run `wrangler d1 list` to see your databases

### Authentication fails

1. Check JWT_SECRET is set correctly
2. Verify password hashes in database match bcrypt format
3. Check browser console for detailed error messages

### LiveKit connection fails

1. Verify LIVEKIT_WS_URL is accessible
2. Check LiveKit API credentials are correct
3. Ensure LiveKit server is running and accessible via Cloudflare Tunnel

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Build for Cloudflare Pages
pnpm pages:build

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check [LiveKit Documentation](https://docs.livekit.io)
- Check [Cloudflare Documentation](https://developers.cloudflare.com)

## Acknowledgments

- [LiveKit](https://livekit.io) - Real-time voice/video infrastructure
- [Cloudflare](https://cloudflare.com) - Edge platform & hosting
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
