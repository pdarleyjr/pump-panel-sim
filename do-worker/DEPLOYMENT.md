# Durable Objects Worker Deployment

## WebSocket Instructor Mode

The Durable Objects worker provides real-time WebSocket connectivity for instructor mode, allowing remote control of simulator scenarios.

**Worker URL:** https://pump-sim-instructor.pdarleyjr.workers.dev

## Deployment

### Prerequisites
- Cloudflare account with Workers/Durable Objects enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare API token with Workers permissions

### Deploy Worker

```bash
cd do-worker
npm install

# Set API token
set CLOUDFLARE_API_TOKEN=<your-token>

# Deploy
npm run deploy
```

### Verify Deployment

Check Cloudflare dashboard:
1. Navigate to Workers & Pages
2. Find `pump-sim-instructor`
3. Verify status: Active
4. Note the worker URL

## Configuration

### Wrangler.toml
- **Worker Name:** pump-sim-instructor
- **Durable Object Binding:** ROOM → Room class
- **SQLite Mode:** Free tier compatible
- **Migration Tag:** v1

### Environment
- **Production:** Automatically deployed
- **Development:** `npm run dev` (local testing)

## Endpoints

### WebSocket Endpoint
`wss://pump-sim-instructor.pdarleyjr.workers.dev/ws?room=<room-name>`

Connect to a specific room for instructor mode:
- Default room: `?room=default`
- Custom room: `?room=training-room-1`

### Health Check
`https://pump-sim-instructor.pdarleyjr.workers.dev/health`

Returns:
```json
{
  "ok": true,
  "ts": 1234567890,
  "service": "pump-sim-instructor"
}
```

## Message Protocol

### Message Types

#### SCENARIO_EVENT
Trigger emergency scenarios:
```javascript
{
  type: 'SCENARIO_EVENT',
  event: 'HOSE_BURST' | 'INTAKE_FAILURE' | 'TANK_LEAK' | 'GOVERNOR_FAILURE',
  lineId?: string,      // For HOSE_BURST
  intakeId?: string     // For INTAKE_FAILURE
}
```

#### SET_PARAMETER
Update simulation parameters:
```javascript
{
  type: 'SET_PARAMETER',
  parameter: 'hydrantPressure',
  value: number,
  intakeId: string
}
```

### Heartbeat
- Client → Server: `"ping"`
- Server → Client: `"pong"`
- Interval: 20 seconds (client), 25 seconds (server)

## Testing

### WebSocket Connection Test

Using browser console:
```javascript
const ws = new WebSocket('wss://pump-sim-instructor.pdarleyjr.workers.dev/ws?room=test');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Received:', e.data);

// Send scenario trigger
ws.send(JSON.stringify({ 
  type: 'SCENARIO_EVENT', 
  event: 'HOSE_BURST',
  lineId: 'xlay1'
}));
```

### Instructor Mode Test

1. Open simulator: https://fire-pump-panel-simulator.pages.dev
2. Click Settings (⚙️)
3. Enable "Instructor Mode" checkbox
4. Verify connection indicator shows "🟢 Connected"
5. Test scenario triggers:
   - 💥 Hose Burst
   - 🚰 Intake Failure
   - 💧 Tank Leak
   - ⚠️ Governor Fail

## Troubleshooting

### Connection Refused
**Issue:** WebSocket fails to connect

**Solutions:**
- Verify worker is deployed and active in Cloudflare dashboard
- Check WebSocket URL matches worker URL exactly
- Verify CSP allows `wss://*.workers.dev`
- Check browser console for specific errors

### CORS Errors
**Issue:** CORS headers missing or incorrect

**Solutions:**
- Worker automatically handles OPTIONS requests
- Verify worker code includes proper CORS headers
- Check origin matches production URL

### Durable Objects Errors
**Issue:** Durable Object initialization fails

**Solutions:**
- Verify migration completed successfully in Cloudflare dashboard
- Check worker logs for migration errors
- Ensure SQLite class is properly configured in wrangler.toml

### Message Broadcast Issues
**Issue:** Messages not reaching all clients

**Solutions:**
- Check WebSocket connection status on all clients
- Verify room name matches across clients
- Review browser console for parsing errors
- Check network tab for WebSocket frames

## Monitoring

### Cloudflare Dashboard

Navigate to **Workers & Pages** > **pump-sim-instructor**:

- **Metrics:**
  - Request count
  - Error rate
  - CPU time
  - WebSocket connections
  
- **Logs:**
  - Real-time streaming logs
  - Error traces
  - Performance metrics

- **Durable Objects:**
  - Active instances
  - Storage usage
  - Request patterns

### Performance Benchmarks
- WebSocket latency: <50ms (typical)
- Message broadcast: <100ms for 10 clients
- Heartbeat interval: 20-25 seconds
- Auto-reconnect delay: 5 seconds

## Security

### CSP Configuration
Main application already configured to allow WebSocket connections:
```
connect-src 'self' wss://*.workers.dev
```

### Origin Validation
Worker accepts connections from:
- `https://fire-pump-panel-simulator.pages.dev`
- Any Cloudflare Pages preview URL
- Localhost (development only)

### Best Practices
- Use unique room names for isolated sessions
- Implement room access controls if needed
- Monitor for unusual connection patterns
- Rate limit message broadcasts if necessary

## Development

### Local Testing

```bash
# Start local development server
cd do-worker
npm run dev

# Connect from localhost
ws://localhost:8787/ws?room=dev-test
```

### Logs

```bash
# Stream real-time logs
npm run tail

# Or using wrangler directly
npx wrangler tail pump-sim-instructor
```

## Deployment History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-14 | v1 | Initial deployment with WebSocket support |
| | | SQLite Durable Objects for free tier |
| | | Heartbeat keepalive mechanism |
| | | Message broadcast functionality |

## Support

For issues or questions:
1. Check Cloudflare Worker logs
2. Review browser console for client errors
3. Verify network connectivity
4. Test with WebSocket debugging tools