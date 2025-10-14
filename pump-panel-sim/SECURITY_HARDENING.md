# Phase 1 - Security & Infrastructure Hardening

**Date Completed:** [TO BE FILLED]  
**Status:** CRITICAL - Credentials were exposed and MUST be rotated immediately

---

## ⚠️ CRITICAL: Credential Rotation Required

The following credentials have been exposed in planning documents and MUST be rotated:
- Cloudflare API Token
- GitHub Personal Access Token

### Step 1: Generate NEW Cloudflare API Token

1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Set permissions (EXACT permissions required):
   - **Account / Cloudflare Pages / Edit**
   - **Account / Workers Scripts / Edit**
   - **Zone / Zone / Read** (only if using custom domain)
4. Token name: `pump-sim-ci-cd-token`
5. Set expiration: 90 days (recommended)
6. Click "Continue to summary"
7. Click "Create Token"
8. **COPY THE TOKEN NOW** (you'll only see it once)

### Step 2: Generate NEW GitHub Personal Access Token

1. Visit: https://github.com/settings/tokens/new
2. Token name: `pump-sim-deploy`
3. Expiration: 90 days
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Actions workflows)
5. Click "Generate token"
6. **COPY THE TOKEN NOW** (you'll only see it once)

### Step 3: Update GitHub Repository Secrets

Using GitHub CLI (recommended):

```powershell
# Set new Cloudflare API token
gh secret set CLOUDFLARE_API_TOKEN --body "YOUR_NEW_CLOUDFLARE_TOKEN_HERE"

# Set Cloudflare Account ID (if not already set)
gh secret set CLOUDFLARE_ACCOUNT_ID --body "265122b6d6f29457b0ca950c55f3ac6e"
```

**OR** via GitHub Web UI:

1. Visit: https://github.com/pdarleyjr/pump-panel-sim/settings/secrets/actions
2. Click "New repository secret"
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: [Paste your new Cloudflare token]
5. Click "Add secret"
6. Repeat for `CLOUDFLARE_ACCOUNT_ID` if not present

### Step 4: Revoke Old Credentials

**Delete Old Cloudflare Token:**
1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Find the old token
3. Click "Delete" or "Revoke"
4. Confirm deletion

**Delete Old GitHub PAT:**
1. Visit: https://github.com/settings/tokens
2. Find the old token (pump-sim-deploy or similar)
3. Click "Delete"
4. Confirm deletion

### Step 5: Verify New Credentials Work

After updating secrets, trigger a test deployment:

```powershell
# Create a test commit to trigger CI/CD
git commit --allow-empty -m "test: verify new credentials"
git push
```

Monitor the GitHub Actions run:
- https://github.com/pdarleyjr/pump-panel-sim/actions

Expected outcomes:
- ✅ Tests pass
- ✅ Worker deploys successfully
- ✅ Pages deploys successfully
- ✅ No authentication errors in logs

---

## 🔒 GitHub Security Features

### Enable Secret Scanning & Push Protection

Using GitHub CLI:

```powershell
gh api -X PATCH /repos/pdarleyjr/pump-panel-sim -f security_and_analysis='{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}'
```

### Verify Security Settings

Visit: https://github.com/pdarleyjr/pump-panel-sim/settings/security_analysis

Ensure the following are enabled:
- ✅ **Secret scanning** - Enabled
- ✅ **Push protection** - Enabled  
- ✅ **Dependabot alerts** - Enabled
- ✅ **Dependabot security updates** - Enabled (optional but recommended)

### Enable Code Scanning (CodeQL)

1. Visit: https://github.com/pdarleyjr/pump-panel-sim/security/code-scanning
2. Click "Set up code scanning"
3. Choose "CodeQL Analysis"
4. Click "Configure"
5. Review and commit the generated workflow file

---

## ✅ Infrastructure Improvements Implemented

### 1. Enhanced Health Endpoint

- **File:** `do-worker/src/index.ts`
- **Changes:**
  - Proper JSON response format: `{"ok":true,"ts":1234567890,"service":"pump-sim-instructor"}`
  - Correct `content-type` header: `application/json; charset=utf-8`
  - Cache control: `no-store` to prevent caching

**Test the health endpoint:**
```powershell
curl https://pump-sim-instructor.pdarleyjr.workers.dev/health
```

Expected response:
```json
{"ok":true,"ts":1234567890,"service":"pump-sim-instructor"}
```

### 2. WebSocket Hibernation with Heartbeat

- **Files:** `do-worker/src/index.ts`, `pump-panel-sim/src/net/ws.ts`
- **Changes:**
  - Server sends `ping` every 25 seconds
  - Client sends `ping` every 20 seconds
  - Both handle `pong` responses
  - Prevents idle connection timeouts
  - Detects dead connections early

### 3. Automatic Reconnection

- **File:** `pump-panel-sim/src/net/ws.ts`
- **Changes:**
  - Client automatically reconnects after 5 seconds on disconnect
  - Properly cleans up heartbeat intervals
  - Maintains connection resilience

### 4. CI/CD Pipeline Improvements

- **File:** `pump-panel-sim/.github/workflows/deploy.yml`
- **Changes:**
  - Upgraded to `cloudflare/wrangler-action@v3`
  - Separated test, worker deployment, and pages deployment into distinct jobs
  - Worker deployment includes `--minify` flag for optimization
  - Pages deployment includes `--branch=main` for better tracking
  - Proper dependency ordering (tests must pass before deployment)

### 5. Durable Objects Configuration

- **File:** `do-worker/wrangler.toml`
- **Changes:**
  - Using `new_sqlite_classes` for free tier compatibility
  - Enabled observability for better monitoring
  - Proper compatibility date set

---

## 🧪 Testing & Verification

### Test Worker Deployment

```powershell
cd do-worker
npx wrangler deploy --minify
```

### Test Health Endpoint

```powershell
curl https://pump-sim-instructor.pdarleyjr.workers.dev/health
```

### Test WebSocket Connection

```javascript
const ws = new WebSocket('wss://pump-sim-instructor.pdarleyjr.workers.dev/ws?room=test');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Received:', e.data);
ws.send('ping'); // Should receive 'pong' back
```

### Test Pages Deployment

```powershell
cd pump-panel-sim
npm ci
npm run build
npx wrangler pages deploy dist --project-name=pump-panel-sim --branch=main
```

---

## 📝 Commit Message Template

When committing these changes, use this message:

```
security: rotate credentials and harden infrastructure

CRITICAL SECURITY UPDATE:
- Rotated all exposed API tokens and PATs
- Old credentials have been revoked
- Verified new credentials work in CI/CD

INFRASTRUCTURE IMPROVEMENTS:
- Added proper /health endpoint with JSON response
- Implemented WebSocket hibernation with heartbeat (ping/pong)
- Added automatic reconnection to WebSocket client
- Upgraded to wrangler-action@v3 for CI/CD
- Enabled GitHub secret scanning and push protection
- Separated worker and pages deployment jobs

TESTING:
- Health endpoint returns 200 with proper JSON
- WebSocket heartbeat prevents idle timeouts
- All CI/CD jobs run successfully
- No secrets exposed in logs

Closes #[issue-number]
```

---

## 🔐 Security Checklist

Before marking this phase complete, verify:

- [ ] New Cloudflare API token generated with minimal permissions
- [ ] New GitHub PAT generated with only required scopes
- [ ] GitHub secrets updated with new credentials
- [ ] Old Cloudflare token deleted/revoked
- [ ] Old GitHub PAT deleted/revoked
- [ ] Test deployment successful with new credentials
- [ ] GitHub secret scanning enabled
- [ ] Push protection enabled
- [ ] Dependabot alerts enabled
- [ ] CodeQL analysis configured (optional)
- [ ] Health endpoint returns proper JSON
- [ ] WebSocket heartbeat working
- [ ] Automatic reconnection working
- [ ] CI/CD pipeline using wrangler-action@v3
- [ ] All tests passing
- [ ] No secrets visible in CI/CD logs

---

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs: https://github.com/pdarleyjr/pump-panel-sim/actions
2. Verify secrets are set: https://github.com/pdarleyjr/pump-panel-sim/settings/secrets/actions
3. Test Cloudflare token: `echo "YOUR_TOKEN" | npx wrangler whoami`
4. Check worker logs: `npx wrangler tail pump-sim-instructor`

---

**Last Updated:** [TO BE FILLED]  
**Completed By:** [TO BE FILLED]