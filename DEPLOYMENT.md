# Deployment Guide

## Cloudflare Pages Deployment

### Automatic Deployments

The Fire Pump Panel Simulator is automatically deployed via Cloudflare Pages when changes are pushed to the `main` branch on GitHub.

**Production URL:** https://fire-pump-panel-simulator.pages.dev

### Build Configuration

- **Build Command:** `cd pump-panel-sim && npm install && npm run build`
- **Build Output:** `pump-panel-sim/dist`
- **Node Version:** 18.x
- **Framework:** Vite

### Manual Deployment

```bash
cd pump-panel-sim
npm install
npm run build
npx wrangler pages deploy dist --project-name=fire-pump-panel-simulator
```

### Environment Setup

1. Install Wrangler CLI: `npm install -g wrangler`
2. Set Cloudflare API token:
   ```bash
   set CLOUDFLARE_API_TOKEN=your_token_here
   ```
3. Deploy using commands above

### Security Headers

CSP and security headers are configured in `pump-panel-sim/public/_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self'; connect-src 'self' wss://*.workers.dev; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;
  Permissions-Policy: accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
```

**Note:** `'unsafe-eval'` is required for PixiJS WebGL shader compilation. This is a necessary security trade-off for WebGL rendering.

### Post-Deployment Checklist

- [x] Site accessible at production URL
- [x] CSP headers present (check DevTools)
- [x] PixiJS rendering smooth (60 FPS)
- [x] All gauges and controls visible
- [x] No CSP errors in console
- [ ] Audio system functional (requires user gesture)
- [ ] All interactive controls working
- [ ] Keyboard shortcuts functional
- [ ] Touch interactions responsive
- [ ] Training overlays display correctly
- [ ] No console errors

### Deployment History

#### Latest Deployment
- **Date:** October 14, 2025
- **Status:** ✅ Successful
- **Bundle Size:** 1.07 MB (289 KB gzipped)
- **Issues Fixed:**
  - Added missing `useMemo` import in SimulationContext.tsx
  - Added `'unsafe-eval'` to CSP for PixiJS WebGL support

### Rollback Procedure

Cloudflare Pages maintains deployment history. To rollback:

1. Go to Cloudflare dashboard
2. Navigate to Pages project: `fire-pump-panel-simulator`
3. Select Deployments tab
4. Choose previous successful deployment
5. Promote to production

### Troubleshooting

#### Build Failures
- Check build logs in Cloudflare dashboard
- Verify Node version compatibility (18.x)
- Check for dependency conflicts
- Ensure all imports are correct

#### Runtime Errors

**PixiJS CSP Error:**
```
Error: Current environment does not allow unsafe-eval
```
**Solution:** Ensure `'unsafe-eval'` is present in CSP script-src directive

**Audio Context Warnings:**
```
The AudioContext was not allowed to start
```
**Solution:** This is expected - audio starts after user gesture (click/tap)

**Missing React Hooks:**
```
ReferenceError: useMemo is not defined
```
**Solution:** Ensure all React hooks are imported in component files

#### Performance Issues
- Verify asset compression enabled
- Check CDN cache status
- Review bundle sizes
- Monitor FPS in DevTools Performance tab

### Technical Details

**Cloudflare Pages Configuration:**
- **Project Name:** fire-pump-panel-simulator
- **Production Branch:** main
- **Build Output Directory:** pump-panel-sim/dist
- **Account ID:** 265122b6d6f29457b0ca950c55f3ac6e

**Build Settings:**
- TypeScript compilation with strict mode
- Vite production build with tree-shaking
- Code splitting for optimal loading
- Gzip compression on all assets

**Asset Optimization:**
- CSS minification and extraction
- JavaScript bundling with source maps
- Static assets with immutable caching
- HTML with no-cache directive

### Monitoring

**Key Metrics to Track:**
- Page load time (target: < 2 seconds)
- Time to Interactive (target: < 3 seconds)
- First Contentful Paint (target: < 1.5 seconds)
- Largest Contentful Paint (target: < 2.5 seconds)
- Cumulative Layout Shift (target: < 0.1)

**Error Monitoring:**
- Check Cloudflare Analytics for deployment status
- Monitor console errors via user reports
- Track CSP violations in browser DevTools

## Durable Objects WebSocket Worker

### Overview

The WebSocket worker enables real-time instructor mode, allowing instructors to remotely control simulator scenarios and parameters.

**Worker URL:** https://pump-sim-instructor.pdarleyjr.workers.dev

### Deployment

```bash
cd do-worker
npm install

# Set Cloudflare API token
set CLOUDFLARE_API_TOKEN=your_token_here

# Deploy worker
npm run deploy
```

### Configuration

- **Worker Name:** pump-sim-instructor
- **Durable Objects:** Room class (SQLite-based for free tier)
- **Endpoints:**
  - WebSocket: `wss://pump-sim-instructor.pdarleyjr.workers.dev/ws?room=<name>`
  - Health Check: `https://pump-sim-instructor.pdarleyjr.workers.dev/health`

### Integration

The main application connects to the WebSocket worker via instructor mode:

1. Open Settings (⚙️) in the simulator
2. Enable "Instructor Mode" checkbox
3. Configure room name (default: "training-room-1")
4. WebSocket URL is pre-configured: `wss://pump-sim-instructor.pdarleyjr.workers.dev`
5. Connection indicator shows status: 🟢 Connected / 🔴 Disconnected

### Features

**Scenario Triggers:**
- 💥 Hose Burst - Force discharge line failure
- 🚰 Intake Failure - Simulate hydrant pressure drop
- 💧 Tank Leak - Accelerate tank depletion
- ⚠️ Governor Fail - Disable automatic governor

**Parameter Control:**
- Hydrant pressure adjustment (0-100 PSI)
- Real-time parameter synchronization
- Multi-client broadcast support

### Documentation

Full deployment and troubleshooting documentation: [`do-worker/DEPLOYMENT.md`](do-worker/DEPLOYMENT.md:1)

### Deployment Status

- **Status:** ✅ Deployed and Active
- **Version:** v1
- **Date:** October 14, 2025
- **Features:**
  - WebSocket room-based sessions
  - Heartbeat keepalive mechanism
  - Message broadcast to all room clients
  - SQLite Durable Objects (free tier)

### Testing

**Quick Test:**
1. Visit: https://fire-pump-panel-simulator.pages.dev
2. Open Settings → Enable "Instructor Mode"
3. Verify "🟢 Connected" status
4. Click any scenario button to test
5. Verify simulator responds to commands

**WebSocket Test (Browser Console):**
```javascript
const ws = new WebSocket('wss://pump-sim-instructor.pdarleyjr.workers.dev/ws?room=test');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.send(JSON.stringify({ type: 'SCENARIO_EVENT', event: 'HOSE_BURST', lineId: 'xlay1' }));
```

## Complete Deployment Checklist

### Main Application (Cloudflare Pages)
- [x] Site deployed and accessible
- [x] CSP headers configured
- [x] PixiJS rendering functional
- [x] All gauges and controls working
- [x] WebSocket URL configured

### Durable Objects Worker
- [x] Worker deployed successfully
- [x] WebSocket endpoint accessible
- [x] Health check responding
- [x] Room-based sessions working
- [x] Message broadcast functional

### Integration & Testing
- [ ] WebSocket connection successful
- [ ] Instructor controls accessible
- [ ] Scenario triggers working
- [ ] Parameter sync functional
- [ ] Multi-client support verified

## Next Steps

1. **Test Instructor Mode End-to-End:**
   - Connect multiple clients to same room
   - Trigger scenarios from instructor controls
   - Verify all clients receive updates
   - Test parameter synchronization

2. **Performance Validation:**
   - Monitor WebSocket latency
   - Check message broadcast speed
   - Verify auto-reconnect behavior
   - Test with multiple concurrent rooms

3. **Production Readiness:**
   - Document usage instructions
   - Create user guides for instructors
   - Set up monitoring and alerts
   - Plan scaling strategy if needed