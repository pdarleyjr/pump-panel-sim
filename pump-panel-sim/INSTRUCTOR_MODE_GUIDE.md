# Instructor Mode Implementation Guide

## Overview
This guide describes the instructor controls implementation for the Fire Pump Panel Simulator. Instructor mode allows training instructors to remotely manipulate simulation parameters and trigger training scenario events.

## Features Implemented

### 1. Hydrant Pressure Control
- **UI Control**: Slider (0-100 PSI) to adjust hydrant intake pressure
- **Target Selection**: Dropdown to select which intake line to control
- **Real-time Updates**: Changes are immediately reflected in the simulation
- **Remote Broadcast**: Changes are sent to connected students via WebSocket

### 2. Scenario Event Triggers
Four training scenarios can be triggered by the instructor:

#### Hose Burst (💥)
- Forces a selected discharge line to close completely
- Simulates a catastrophic hose failure
- Requires quick student response to prevent pump damage

#### Intake Failure (🚰)
- Drops intake pressure to near zero (0-10 PSI random)
- Simulates weak hydrant or supply failure
- Students must diagnose and switch water sources

#### Tank Leak (💧)
- Accelerates tank water depletion rate
- Tests student monitoring and response to water loss
- Can be combined with other scenarios

#### Governor Failure (⚠️)
- Disables automatic governor control
- Switches pump to manual RPM mode
- Tests student ability to manually control pump

### 3. WebSocket Integration
- Real-time communication with Durable Objects worker
- Automatic reconnection on disconnect
- Connection status indicator
- Room-based isolation for multiple training sessions

## Usage Instructions

### Enabling Instructor Mode

1. Open the Settings panel (⚙️ button)
2. Check the "Instructor Mode" checkbox
3. Configure connection settings:
   - **Room Name**: Unique identifier for this training session (default: `training-room-1`)
   - **WebSocket URL**: URL of your deployed Durable Objects worker (e.g., `wss://your-worker.workers.dev`)
4. The instructor control panel will appear below

### Using Instructor Controls

#### Adjusting Hydrant Pressure
1. Select target intake line from dropdown
2. Move the "Hydrant Pressure" slider (0-100 PSI)
3. Changes apply immediately to local simulation
4. If connected, changes broadcast to all students in the room

#### Triggering Scenarios
1. For Hose Burst: Select target discharge line from dropdown first
2. Click the desired scenario button
3. Scenario applies immediately to local simulation
4. If connected, scenario broadcasts to all students in the room

### Connection Status
- 🟢 Connected: WebSocket connected to server, can broadcast to students
- 🔴 Disconnected: Running in local mode only, no remote control

## Technical Implementation

### Files Modified

#### [`pump-panel-sim/src/sim/actions.ts`](pump-panel-sim/src/sim/actions.ts)
- Added 5 new action types:
  - `SET_INTAKE_PRESSURE`: Direct control of intake pressure
  - `SCENARIO_HOSE_BURST`: Force discharge line closure
  - `SCENARIO_INTAKE_FAILURE`: Simulate hydrant failure
  - `SCENARIO_TANK_LEAK`: Accelerate tank depletion
  - `SCENARIO_GOVERNOR_FAILURE`: Disable governor automation

#### [`pump-panel-sim/src/net/ws.ts`](pump-panel-sim/src/net/ws.ts)
- Extended `InstructorMessage` interface to support new command protocol
- Added fields: `event`, `parameter`, `value`, `lineId`, `intakeId`

#### [`pump-panel-sim/src/net/useInstructor.ts`](pump-panel-sim/src/net/useInstructor.ts)
- Implemented message handler to dispatch actions based on WebSocket messages
- Maps instructor commands to simulation actions
- Accepts dispatch function from SimulationContext

#### [`pump-panel-sim/src/ui/Settings.tsx`](pump-panel-sim/src/ui/Settings.tsx)
- Added instructor mode toggle
- Added room name and WebSocket URL configuration inputs
- Integrated InstructorControls component

#### Created Files
- [`pump-panel-sim/src/ui/InstructorControls.tsx`](pump-panel-sim/src/ui/InstructorControls.tsx): Main instructor UI component
- [`pump-panel-sim/src/ui/InstructorControls.css`](pump-panel-sim/src/ui/InstructorControls.css): Styling for instructor controls

## WebSocket Protocol

### Command Format

```typescript
interface InstructorMessage {
  type: 'SCENARIO_EVENT' | 'SET_PARAMETER';
  event?: 'HOSE_BURST' | 'INTAKE_FAILURE' | 'TANK_LEAK' | 'GOVERNOR_FAILURE';
  parameter?: 'hydrantPressure' | 'tankLevel';
  value?: number;
  lineId?: string;      // For HOSE_BURST events
  intakeId?: string;    // For intake-related events
}
```

### Example Messages

```json
// Set hydrant pressure
{
  "type": "SET_PARAMETER",
  "parameter": "hydrantPressure",
  "value": 75,
  "intakeId": "ldh_driver"
}

// Trigger hose burst
{
  "type": "SCENARIO_EVENT",
  "event": "HOSE_BURST",
  "lineId": "xlay2"
}

// Trigger intake failure
{
  "type": "SCENARIO_EVENT",
  "event": "INTAKE_FAILURE",
  "intakeId": "ldh_driver"
}
```

## Deployment Notes

### Durable Objects Worker

The WebSocket server requires a separate Cloudflare Durable Objects worker deployment:

1. **Location**: [`do-worker/`](do-worker/) directory
2. **Deployment**: 
   ```bash
   cd do-worker
   npm install
   npx wrangler deploy
   ```
3. **Configuration**: Update `wrangler.toml` with your account details
4. **URL**: After deployment, use the provided URL in Settings (e.g., `wss://your-worker.your-subdomain.workers.dev`)

### Environment Variables

You may want to configure default values via environment variables:
- `VITE_DEFAULT_INSTRUCTOR_ROOM`: Default room name
- `VITE_INSTRUCTOR_WORKER_URL`: Default WebSocket worker URL

### Local Development

For local testing without WebSocket:
1. Enable Instructor Mode
2. Use controls locally (broadcasts will fail gracefully)
3. All controls still work for local simulation
4. No need to deploy worker for single-machine testing

## Testing Recommendations

### Basic Functionality Tests

1. **Hydrant Pressure Control**
   - Enable instructor mode
   - Move hydrant pressure slider
   - Verify intake pressure gauge changes immediately
   - Test with different intake selections

2. **Hose Burst Scenario**
   - Select a discharge line
   - Click "💥 Hose Burst" button
   - Verify selected line closes (gauge shows 0)
   - Verify other lines unaffected

3. **Intake Failure Scenario**
   - Click "🚰 Intake Failure" button
   - Verify intake pressure drops to near-zero
   - Test pump behavior with low intake pressure

4. **Governor Failure Scenario**
   - Start with pump in PRESSURE mode
   - Click "⚠️ Governor Fail" button
   - Verify governor switches to RPM mode
   - Test manual control behavior

5. **UI Visibility**
   - Verify controls only visible when instructor mode enabled
   - Verify connection status indicator updates
   - Verify room name displays correctly

### WebSocket Tests (requires deployed worker)

1. **Connection Status**
   - Enable instructor mode with valid worker URL
   - Verify status indicator turns green (connected)
   - Disable network, verify status turns red
   - Re-enable network, verify auto-reconnection

2. **Multi-Client Scenario**
   - Open simulator in two browser windows
   - Enable instructor mode in window 1 (instructor)
   - Join same room in window 2 (student)
   - Adjust hydrant pressure in instructor window
   - Verify pressure changes in student window
   - Trigger scenarios, verify they appear in student window

## Known Limitations

1. **Tank Leak Scenario**: Currently sets a flag but doesn't implement accelerated depletion (would require modifications to [`engine.ts`](pump-panel-sim/src/sim/engine.ts))
2. **Visual Feedback**: Scenario events currently lack visual/audio indicators (could be enhanced with overlays or alerts)
3. **Undo**: No undo/reset functionality for triggered scenarios (instructor must manually restore state)
4. **Authentication**: No authentication for instructor role (anyone who knows the room name can join as instructor)

## Future Enhancements

Potential improvements for future phases:
- Visual indicators when scenarios are triggered (overlay messages, alerts)
- Scenario history log
- Ability to reset/undo scenarios
- Multi-instructor support with role permissions
- Preset scenario combinations
- Student performance metrics
- Recording and playback of training sessions
- Authentication and access control

## Support

For issues or questions:
1. Check browser console for WebSocket connection errors
2. Verify Durable Objects worker is deployed and accessible
3. Ensure correct room name is used across all clients
4. Test in local mode first (no WebSocket) to isolate issues