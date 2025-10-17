# GitHub Actions Deployment Workflows

This directory contains automated deployment workflows for both the Cloudflare Pages frontend and the Cloudflare Workers backend.

## Workflows

### 1. `deploy-pages.yml`
- **Triggers**: On push to `main` branch when files in `pump-panel-sim/` change
- **Deploys**: Frontend application to Cloudflare Pages
- **URL**: https://fire-pump-panel-simulator.pages.dev

### 2. `deploy-worker.yml`
- **Triggers**: On push to `main` branch when files in `do-worker/` change
- **Deploys**: Durable Objects worker to Cloudflare Workers
- **URL**: https://pump-sim-instructor.pdarleyjr.workers.dev

## Required GitHub Secrets

You must add these secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

### `CLOUDFLARE_API_TOKEN`
- Create at: https://dash.cloudflare.com/profile/api-tokens
- Required permissions:
  - Account: Cloudflare Pages:Edit
  - Account: Cloudflare Workers Scripts:Edit
  - Account: Account Settings:Read
  - Zone: Page Rules:Edit (if using custom domain)

### `CLOUDFLARE_ACCOUNT_ID`
- Find at: https://dash.cloudflare.com/ → Right sidebar
- Value: `265122b6d6f29457b0ca950c55f3ac6e` (from your wrangler.toml)

## Testing the Workflows

After adding the secrets, the workflows will automatically run when you push changes to the `main` branch.

To test immediately:
1. Make a small change to any file
2. Commit and push to `main`
3. Check the Actions tab on GitHub to see the deployment progress

## Manual Deployment (Fallback)

If GitHub Actions fail, you can still deploy manually:

```bash
# Deploy Worker
cd do-worker
npm run deploy

# Deploy Pages
cd pump-panel-sim
npm run build
npx wrangler pages deploy dist --project-name=fire-pump-panel-simulator
```