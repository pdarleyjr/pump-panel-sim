/**
 * WebSocket client for instructor mode
 * Connects to Cloudflare Durable Objects Worker for real-time collaboration
 */

export interface InstructorMessage {
  type: 'control_change' | 'state_sync' | 'reset' | 'scenario_load' | 'SCENARIO_EVENT' | 'SET_PARAMETER';
  data?: any;
  // Instructor command fields
  event?: 'HOSE_BURST' | 'INTAKE_FAILURE' | 'TANK_LEAK' | 'GOVERNOR_FAILURE';
  parameter?: 'hydrantPressure' | 'tankLevel';
  value?: number;
  lineId?: string; // For HOSE_BURST events
  intakeId?: string; // For intake-related events
}

let ws: WebSocket | null = null;
const messageHandlers: Set<(msg: InstructorMessage) => void> = new Set();
let heartbeatInterval: NodeJS.Timeout | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

/**
 * Connect to instructor room with automatic reconnection
 * @param room - Room name/ID
 * @param workerUrl - Worker URL
 */
export function connect(room: string = 'default', workerUrl: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.warn('WebSocket already connected');
    return;
  }

  const url = `${workerUrl}/ws?room=${encodeURIComponent(room)}`;
  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('Connected to instructor room:', room);
    
    // Start heartbeat
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 20000); // 20 seconds
  };

  ws.onmessage = (event: MessageEvent) => {
    // Ignore heartbeat pongs
    if (event.data === 'pong' || event.data === 'ping') {
      return;
    }
    
    try {
      const message: InstructorMessage = JSON.parse(event.data);
      messageHandlers.forEach(handler => handler(message));
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Disconnected from instructor room');
    ws = null;
    
    // Clear heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    
    // Attempt reconnection after 5 seconds
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      connect(room, workerUrl);
    }, 5000);
  };
}

/**
 * Broadcast message to room
 */
export function broadcast(message: InstructorMessage): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket not connected');
  }
}

/**
 * Subscribe to messages
 */
export function onMessage(handler: (msg: InstructorMessage) => void): () => void {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

/**
 * Disconnect from room
 */
export function disconnect(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}