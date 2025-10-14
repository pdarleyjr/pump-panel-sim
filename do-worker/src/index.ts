/**
 * Fire Pump Simulator - Instructor Mode Worker
 * Provides real-time WebSocket connectivity for classroom scenarios
 */

export interface Env {
  ROOM: DurableObjectNamespace;
}

/**
 * Main worker fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check endpoint - fast JSON response
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ ok: true, ts: Date.now(), service: 'pump-sim-instructor' }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'
          }
        }
      );
    }
    
    // Handle WebSocket upgrade requests
    if (url.pathname === '/ws') {
      // Check for WebSocket upgrade
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 });
      }
      
      // Get or create room by name
      const roomName = url.searchParams.get('room') || 'default';
      const id = env.ROOM.idFromName(roomName);
      const stub = env.ROOM.get(id);
      
      // Forward request to Durable Object
      return stub.fetch(request);
    }
    
    return new Response('Fire Pump Simulator - Instructor Mode Worker', { 
      status: 200,
      headers: { 'content-type': 'text/plain' }
    });
  }
};

/**
 * Room Durable Object with WebSocket Hibernation support
 */
export class Room {
  private state: DurableObjectState;
  private sessions: Map<string, WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  /**
   * Handle incoming requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/ws') {
      // Create WebSocket pair
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Accept WebSocket
      server.accept();
      
      // Generate session ID
      const sessionId = crypto.randomUUID();
      this.sessions.set(sessionId, server);

      // Heartbeat to prevent idle disconnects and detect dead peers
      let heartbeatInterval: NodeJS.Timeout | null = null;
      
      server.addEventListener('message', (event: MessageEvent) => {
        const msg = event.data as string;
        
        // Handle heartbeat pings
        if (msg === 'ping') {
          server.send('pong');
          return;
        }
        
        // Broadcast to all other sessions
        try {
          const data = JSON.parse(msg);
          this.broadcast(msg, sessionId);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      server.addEventListener('close', () => {
        this.sessions.delete(sessionId);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      });

      server.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        this.sessions.delete(sessionId);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      });

      // Send periodic pings to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          if (server.readyState === WebSocket.OPEN) {
            server.send('ping');
          } else {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
          }
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 25000); // 25 seconds

      // Return WebSocket response
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }

  /**
   * Broadcast message to all sessions except sender
   */
  private broadcast(message: string, excludeSessionId?: string): void {
    for (const [sid, ws] of this.sessions) {
      if (sid === excludeSessionId) continue;
      
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      } catch (error) {
        console.error('Error broadcasting to session:', error);
        // Remove failed session
        this.sessions.delete(sid);
      }
    }
  }
}