# TradeNet MY

TradeNet MY is a standalone stock trading profit/loss calculator tailored for Malaysian users trading US stocks (via MooMoo) and local Bursa Malaysia stocks.

## Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React
- **Hosting / Functions**: Cloudflare Pages & Cloudflare Pages Functions

---

## Local Development

### Option 1: Standard Vite Development Server
Runs the frontend only. Note that Pages Functions API endpoints (like Yahoo Quotes) will fallback gracefully or fail.
```bash
npm install
npm run dev
```

### Option 2: Full Local Dev with Cloudflare Wrangler (API support)
To emulate the production environment locally including backend API Pages Functions, compile the frontend build and run it with Wrangler Pages dev:

1. **Install Wrangler** (if needed):
   ```bash
   npm install -D wrangler
   ```

2. **Build the production bundle**:
   ```bash
   npm run build
   ```

3. **Start local emulation**:
   ```bash
   npx wrangler pages dev dist
   ```
   Wrangler will host your compiled frontend assets along with your local `/functions/api` workers on `http://localhost:8788`.

---

## Deployment Settings for Cloudflare Pages

Configure your new project on the Cloudflare Dashboard with the following parameters:

- **Project Name**: `tradenet` (or your choice)
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Functions Directory**: `functions`

Once connected to your repository, pushes to `main` will build and publish automatically with the custom API endpoints!
