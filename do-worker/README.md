# Fire Pump Simulator - Instructor Mode Worker

Cloudflare Worker with Durable Objects providing real-time WebSocket connectivity for classroom scenarios.

## Features

- **Room-based sessions**: Each room is a separate Durable Object instance
- **WebSocket fanout**: Messages broadcast to all participants in a room
- **Automatic state management**: Durable Objects handle connection persistence

## Development

```bash
npm run dev
```

## Deployment

```bash
npm run deploy
```

## Usage

Connect to a room via WebSocket:

```javascript
const ws = new WebSocket('wss://pump-sim-instructor.<subdomain>.workers.dev/ws?room=classroom1');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle instructor commands
};

ws.send(JSON.stringify({
  type: 'control_change',
  control: 'throttle',
  value: 50
}));
```

## Integration with Pages

This Worker can be bound to the Pages Functions environment via Pages settings or wrangler configuration.