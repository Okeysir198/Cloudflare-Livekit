# Deployment Guide

Complete step-by-step guide to deploy the LiveKit Voice Agent to Cloudflare.

## Prerequisites

- [ ] Cloudflare account (free tier)
- [ ] GitHub account (for Git deployment)
- [ ] Node.js 18+ installed
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] LiveKit server running (self-hosted or LiveKit Cloud)
- [ ] Git installed

## Step 1: Prepare Your Code

### 1.1 Clone Repository

```bash
git clone <your-repo-url>
cd Cloudflare-Livekit
```

### 1.2 Install Dependencies

```bash
pnpm install
# or
npm install
```

## Step 2: Set Up Cloudflare D1 Database

### 2.1 Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### 2.2 Create D1 Database

```bash
wrangler d1 create livekit-conversations
```

**Expected output:**
```
✅ Successfully created DB 'livekit-conversations'

[[d1_databases]]
binding = "DB"
database_name = "livekit-conversations"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2.3 Update wrangler.toml

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "livekit-conversations"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with actual ID
```

### 2.4 Apply Database Schema

```bash
wrangler d1 execute livekit-conversations --file=./sql/schema.sql
```

### 2.5 Generate Password Hashes

```bash
# Generate hash for admin password
node scripts/generate-hash.js admin123

# Generate hash for demo password
node scripts/generate-hash.js demo123
```

**Copy the hashes** and update `sql/seed.sql`:

```sql
INSERT INTO users (..., password_hash, ...) VALUES
(
  ...,
  '$2a$10$<YOUR_ADMIN_HASH_HERE>',  -- Replace this
  ...
),
(
  ...,
  '$2a$10$<YOUR_DEMO_HASH_HERE>',   -- Replace this
  ...
);
```

### 2.6 Seed Database

```bash
wrangler d1 execute livekit-conversations --file=./sql/seed.sql
```

### 2.7 Verify Database

```bash
# List all users
wrangler d1 execute livekit-conversations --command="SELECT username, email, role FROM users"
```

You should see:
```
username | email | role
admin | admin@example.com | admin
demo | demo@example.com | demo
```

## Step 3: Configure Environment Variables

### 3.1 Generate JWT Secret

```bash
# Generate a random 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this for later.

### 3.2 Get LiveKit Credentials

From your LiveKit server dashboard or configuration:
- `LIVEKIT_API_KEY` - Your API key
- `LIVEKIT_API_SECRET` - Your API secret
- `LIVEKIT_WS_URL` - Your WebSocket URL (e.g., `wss://your-server.com`)

## Step 4: Deploy to Cloudflare Pages

### Option A: GitHub Integration (Recommended)

#### 4.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

#### 4.2 Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** → **Pages**
3. Click **Create a project**
4. Click **Connect to Git**
5. Select your GitHub repository
6. Click **Begin setup**

#### 4.3 Configure Build Settings

- **Production branch:** `main`
- **Build command:** `pnpm pages:build`
- **Build output directory:** `.vercel/output/static`
- **Root directory:** `/` (default)

Click **Save and Deploy**

#### 4.4 Wait for Initial Build

The first build will fail because environment variables are not set. This is expected.

### Option B: CLI Deployment

```bash
# Build for production
pnpm pages:build

# Deploy
wrangler pages deploy .vercel/output/static --project-name=livekit-voice-agent

# You'll be prompted to create the project
```

## Step 5: Configure Environment Variables

### 5.1 Via Cloudflare Dashboard

1. Go to your Pages project
2. Click **Settings** → **Environment variables**
3. Add the following variables for **Production**:

| Variable Name | Value |
|--------------|-------|
| `JWT_SECRET` | Your generated secret from Step 3.1 |
| `LIVEKIT_API_KEY` | Your LiveKit API key |
| `LIVEKIT_API_SECRET` | Your LiveKit API secret |
| `LIVEKIT_WS_URL` | Your LiveKit WebSocket URL |

4. Click **Save**

### 5.2 Via CLI (Alternative)

```bash
wrangler pages secret put JWT_SECRET --project-name=livekit-voice-agent
# Paste your JWT secret when prompted

wrangler pages secret put LIVEKIT_API_KEY --project-name=livekit-voice-agent
# Paste your LiveKit API key

wrangler pages secret put LIVEKIT_API_SECRET --project-name=livekit-voice-agent
# Paste your LiveKit API secret

wrangler pages secret put LIVEKIT_WS_URL --project-name=livekit-voice-agent
# Paste your LiveKit WebSocket URL (e.g., wss://your-server.com)
```

## Step 6: Configure D1 Binding

### 6.1 Via Cloudflare Dashboard

1. Go to your Pages project
2. Click **Settings** → **Functions**
3. Scroll to **D1 database bindings**
4. Click **Add binding**
5. Configure:
   - **Variable name:** `DB`
   - **D1 database:** Select `livekit-conversations`
6. Click **Save**

### 6.2 Redeploy

After adding the binding, trigger a new deployment:

**Via Dashboard:**
- Go to **Deployments** tab
- Click **Retry deployment** on the latest deployment

**Via CLI:**
```bash
wrangler pages deployment create .vercel/output/static --project-name=livekit-voice-agent
```

## Step 7: Verify Deployment

### 7.1 Check Deployment Status

1. Go to **Deployments** tab in Cloudflare Dashboard
2. Wait for status to show **Success**
3. Note your deployment URL (e.g., `livekit-voice-agent.pages.dev`)

### 7.2 Test Login

1. Visit your deployment URL
2. You should be redirected to `/login`
3. Try logging in:
   - Username: `admin`
   - Password: `admin123`
4. You should see the home page

### 7.3 Test API

```bash
# Test login API
curl -X POST https://your-app.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return: {"token":"...", "user":{...}}
```

## Step 8: Configure Custom Domain (Optional)

### 8.1 Add Custom Domain

1. In Pages project, click **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `voice.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (5-10 minutes)

### 8.2 Update LiveKit Configuration

If using custom domain, update `LIVEKIT_WS_URL` if needed.

## Step 9: Set Up LiveKit Server

### 9.1 Self-Hosted (via Cloudflare Tunnel)

If you're hosting LiveKit on your own server:

```bash
# On your server, install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create livekit-tunnel

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: livekit.yourdomain.com
    service: https://localhost:7881
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run livekit-tunnel
```

Update `LIVEKIT_WS_URL` to `wss://livekit.yourdomain.com`

### 9.2 LiveKit Cloud (Alternative)

1. Sign up at [LiveKit Cloud](https://cloud.livekit.io)
2. Create a project
3. Get credentials from dashboard
4. Update environment variables in Cloudflare

## Step 10: Final Testing

### 10.1 Test Complete Flow

1. ✅ Login works
2. ✅ Home page loads
3. ✅ Can generate LiveKit token (check browser DevTools Network tab)
4. ✅ Can create conversation
5. ✅ Can save messages
6. ✅ Can view conversation history

### 10.2 Test Both User Roles

**Admin User:**
```
Username: admin
Password: admin123
```
- Should see all conversations
- Can delete any conversation
- Unlimited conversations

**Demo User:**
```
Username: demo
Password: demo123
```
- Should see only own conversations
- Can delete only own conversations
- Max 10 conversations, 100 messages each

## Troubleshooting

### Build Fails

```bash
# Check build logs in Cloudflare Dashboard
# Common issues:

# 1. Missing dependencies
pnpm install

# 2. TypeScript errors
pnpm tsc --noEmit

# 3. Wrong Node version
# Ensure package.json has: "engines": {"node": ">=18"}
```

### Database Connection Fails

```bash
# Verify database exists
wrangler d1 list

# Check binding in wrangler.toml matches dashboard
# Variable name must be "DB"
# Database name must match

# Test database directly
wrangler d1 execute livekit-conversations --command="SELECT COUNT(*) FROM users"
```

### Authentication Fails

1. Verify JWT_SECRET is set
2. Check password hashes in database
3. Regenerate hashes if needed:
   ```bash
   node scripts/generate-hash.js yourpassword
   ```
4. Update database:
   ```bash
   wrangler d1 execute livekit-conversations --command="UPDATE users SET password_hash='$2a$...' WHERE username='admin'"
   ```

### LiveKit Connection Fails

1. Verify LIVEKIT_WS_URL is correct
2. Check LiveKit server is running
3. Test WebSocket connection:
   ```bash
   wscat -c wss://your-livekit-server.com
   ```
4. Check firewall/network settings

## Monitoring

### View Logs

```bash
# Real-time logs
wrangler pages deployment tail --project-name=livekit-voice-agent

# Or in Dashboard:
# Workers & Pages → Your Project → Logs
```

### Check Analytics

Dashboard → Workers & Pages → Your Project → Analytics

- Request volume
- Error rate
- Response time
- Bandwidth usage

### Monitor D1 Usage

Dashboard → D1 → Your Database → Metrics

- Rows read/written
- Storage used
- Query performance

## Backup & Maintenance

### Backup Database

```bash
# Export all data
wrangler d1 export livekit-conversations --output=backup.sql

# Or specific table
wrangler d1 execute livekit-conversations --command="SELECT * FROM users" --json > users-backup.json
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# This will trigger automatic deployment via GitHub integration

# Or manually:
pnpm pages:build
wrangler pages deploy .vercel/output/static --project-name=livekit-voice-agent
```

### Rollback Deployment

Dashboard → Deployments → Find previous successful deployment → Click **Rollback**

## Cost Optimization

All services used are on **FREE tier**:

- ✅ Cloudflare Pages: Free (unlimited requests)
- ✅ Cloudflare Workers: Free (100K requests/day)
- ✅ Cloudflare D1: Free (5M reads, 100K writes/day)
- ✅ Cloudflare Tunnel: Free

**Total Monthly Cost: $0** 🎉

## Next Steps

- [ ] Change default passwords
- [ ] Set up custom domain
- [ ] Configure LiveKit Python agent
- [ ] Add conversation UI components
- [ ] Implement real-time LiveKit integration
- [ ] Set up monitoring/alerts
- [ ] Configure backup schedule

## Support

If you encounter issues:

1. Check logs in Cloudflare Dashboard
2. Review error messages
3. Consult troubleshooting section above
4. Open issue on GitHub
5. Check Cloudflare Community forums

---

Congratulations! Your LiveKit Voice Agent is now deployed on Cloudflare! 🎉
