// src/audio/AudioProvider.tsx
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

type AudioCtx = {
  ready: boolean;
  init: () => Promise<void>;
};

export const AudioContextCtx = createContext<AudioCtx>({ ready: false, init: async () => {} });

interface AudioProviderProps {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  simState?: any; // Optional for backward compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  simResult?: any; // Optional for backward compatibility
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const toneRef = useRef<typeof Tone | null>(null);
  const initializing = useRef(false);

  const init = useCallback(async () => {
    if (ready || initializing.current) return;
    initializing.current = true;

    // Dynamic import ensures Tone is not evaluated until gesture time
    const ToneModule = await import('tone');
    toneRef.current = ToneModule;

    // Resume context if suspended
    // (Tone.start() internally handles user-gesture unlock for AudioContext)
    await ToneModule.start();
    setReady(true);
    initializing.current = false;
  }, [ready]);

  // Provide a one-shot page-wide unlock
  useEffect(() => {
    const handler = async () => { await init(); };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [init]);

  return (
    <AudioContextCtx.Provider value={{ ready, init }}>
      {children}
    </AudioContextCtx.Provider>
  );
};

// Legacy compatibility hook for existing UI components
export function useAudio() {
  const { ready, init } = useContext(AudioContextCtx);
  const [enabled, setEnabled] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);

  const start = useCallback(async () => {
    await init();
    setEnabled(true);
  }, [init]);

  const stop = useCallback(() => {
    setEnabled(false);
    // Note: We don't suspend the audio context to avoid autoplay issues
  }, []);

  return {
    enabled,
    audioReady: ready,
    masterVolume,
    muted,
    start,
    stop,
    setMasterVolume,
    setMuted,
    playClick: async () => {},
    playValveOpen: async () => {},
    playValveClose: async () => {},
    vibrateClick: () => {},
    vibrateValve: () => {},
  };
}