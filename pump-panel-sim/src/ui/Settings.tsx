import { useAudio } from '@/audio/AudioProvider';
import { useState, useEffect } from 'react';
import { useSimulation } from '@/sim/SimulationContext';
import { useInstructor } from '@/net/useInstructor';
import { InstructorControls } from './InstructorControls';
import { RippleEffect } from './effects/RippleEffect';
import { useTouchFeedback } from './hooks/useTouchFeedback';
import './Settings.css';

interface SettingsPanelProps {
  trainingOverlaysEnabled?: boolean;
  onTrainingOverlaysToggle?: (enabled: boolean) => void;
  touchDebugEnabled?: boolean;
  onTouchDebugToggle?: (enabled: boolean) => void;
}

export function SettingsPanel({
  trainingOverlaysEnabled = true,
  onTrainingOverlaysToggle,
  touchDebugEnabled = false,
  onTouchDebugToggle
}: SettingsPanelProps = {}) {
  const { enabled, start, stop, masterVolume, muted, setMasterVolume, setMuted } = useAudio();
  const { dispatch } = useSimulation();
  const [open, setOpen] = useState(false);
  const [instructorMode, setInstructorMode] = useState(false);
  const [room, setRoom] = useState('training-room-1');
  const [workerUrl, setWorkerUrl] = useState('wss://pump-sim-instructor.pdarleyjr.workers.dev');

  // Initialize instructor hook
  const { connected } = useInstructor(room, workerUrl, instructorMode, dispatch);

  const handleInstructorToggle = (enabled: boolean) => {
    setInstructorMode(enabled);
  };

  // Keyboard shortcut for touch debug (Ctrl+Shift+T)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        if (onTouchDebugToggle) {
          onTouchDebugToggle(!touchDebugEnabled);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [touchDebugEnabled, onTouchDebugToggle]);

  // Touch feedback for settings button
  const settingsButtonFeedback = useTouchFeedback({
    hapticType: 'TAP',
    enableRipple: true,
    onPress: () => setOpen(v => !v),
  });

  return (
    <div className="settings">
      <button
        {...settingsButtonFeedback.touchProps}
        className={`touchable with-ripple ${settingsButtonFeedback.isTouched ? 'touched' : ''}`}
        aria-expanded={open}
      >
        {settingsButtonFeedback.showRipple && <RippleEffect variant="dark" />}
        ⚙️ Settings
      </button>
      {open && (
        <div className="settings-sheet">
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => (e.target.checked ? start() : stop())}
            />
            Audio feedback
          </label>
          {enabled && (
            <>
              <label style={{ marginTop: '0.5rem', display: 'block' }}>
                Master Volume: {Math.round(masterVolume * 100)}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume * 100}
                  onChange={(e) => setMasterVolume(parseInt(e.target.value) / 100)}
                  style={{
                    width: '100%',
                    marginTop: '0.25rem'
                  }}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={(e) => setMuted(e.target.checked)}
                />
                Mute all sounds
              </label>
            </>
          )}
          <label>
            <input
              type="checkbox"
              onChange={(e) => {
                if (navigator.vibrate) {
                  navigator.vibrate(e.target.checked ? [20, 40, 20] : 0);
                }
              }}
            />
            Haptics (if supported)
          </label>
          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
          <label>
            <input
              type="checkbox"
              checked={trainingOverlaysEnabled}
              onChange={(e) => {
                const newValue = e.target.checked;
                if (onTrainingOverlaysToggle) {
                  onTrainingOverlaysToggle(newValue);
                }
                // Save to localStorage
                localStorage.setItem('trainingOverlaysEnabled', String(newValue));
              }}
            />
            Show Training Overlays
          </label>
          <label>
            <input
              type="checkbox"
              checked={touchDebugEnabled}
              onChange={(e) => {
                const newValue = e.target.checked;
                if (onTouchDebugToggle) {
                  onTouchDebugToggle(newValue);
                }
                // Save to localStorage
                localStorage.setItem('touchDebugEnabled', String(newValue));
              }}
            />
            Show Touch Debug Overlay
            <span style={{ fontSize: '0.85em', color: '#666', display: 'block', marginLeft: '1.5rem' }}>
              Keyboard: Ctrl+Shift+T
            </span>
          </label>
          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
          <label>
            <input
              type="checkbox"
              checked={instructorMode}
              onChange={(e) => handleInstructorToggle(e.target.checked)}
            />
            Instructor Mode
          </label>
          {instructorMode && (
            <>
              <label htmlFor="room-name" style={{ marginTop: '0.5rem', display: 'block' }}>
                Room Name:
                <input
                  id="room-name"
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  aria-label="Training room name"
                  style={{
                    width: '100%',
                    marginTop: '0.25rem',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  placeholder="training-room-1"
                />
              </label>
              <label htmlFor="websocket-url" style={{ marginTop: '0.5rem', display: 'block' }}>
                WebSocket URL:
                <input
                  id="websocket-url"
                  type="text"
                  value={workerUrl}
                  onChange={(e) => setWorkerUrl(e.target.value)}
                  aria-label="WebSocket server URL"
                  style={{
                    width: '100%',
                    marginTop: '0.25rem',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  placeholder="wss://your-worker.workers.dev"
                />
              </label>
              <InstructorControls connected={connected} room={room} />
            </>
          )}
        </div>
      )}
    </div>
  );
}