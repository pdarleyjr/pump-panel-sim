/**
 * useAnnouncer Hook
 * Provides a simple API for components to make screen reader announcements
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Announcement, AnnouncementPriority } from './ScreenReaderAnnouncer';

interface UseAnnouncerOptions {
  /** Minimum time (ms) between announcements with the same prefix */
  debounceMs?: number;
  /** Maximum number of announcements to keep in queue */
  maxQueueSize?: number;
}

interface AnnouncerAPI {
  /** Current announcements in queue */
  announcements: Announcement[];
  /** Announce a message to screen readers */
  announce: (message: string, priority?: AnnouncementPriority) => void;
  /** Announce a value change (with debouncing) */
  announceValue: (label: string, value: number, unit: string, priority?: AnnouncementPriority) => void;
  /** Clear all announcements */
  clear: () => void;
}

/**
 * Hook to manage screen reader announcements
 * Provides debouncing and queue management
 */
export function useAnnouncer(options: UseAnnouncerOptions = {}): AnnouncerAPI {
  const { debounceMs = 1000, maxQueueSize = 10 } = options;
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const lastAnnouncementTimeRef = useRef<Map<string, number>>(new Map());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach(timer => clearTimeout(timer));
      debounceTimersRef.current.clear();
    };
  }, []);

  const announce = useCallback((message: string, priority: AnnouncementPriority = 'normal') => {
    const announcement: Announcement = {
      id: `announcement-${Date.now()}-${Math.random()}`,
      message,
      priority,
      timestamp: Date.now(),
    };

    setAnnouncements(prev => {
      const newAnnouncements = [...prev, announcement];
      // Keep only the most recent announcements
      return newAnnouncements.slice(-maxQueueSize);
    });
  }, [maxQueueSize]);

  const announceValue = useCallback((
    label: string,
    value: number,
    unit: string,
    priority: AnnouncementPriority = 'normal'
  ) => {
    const key = `${label}-${unit}`;
    const now = Date.now();
    const lastTime = lastAnnouncementTimeRef.current.get(key) || 0;

    // Clear any existing debounce timer for this key
    const existingTimer = debounceTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // If enough time has passed, announce immediately
    if (now - lastTime >= debounceMs) {
      const message = formatValueForAnnouncement(label, value, unit);
      announce(message, priority);
      lastAnnouncementTimeRef.current.set(key, now);
    } else {
      // Otherwise, debounce the announcement
      const timer = setTimeout(() => {
        const message = formatValueForAnnouncement(label, value, unit);
        announce(message, priority);
        lastAnnouncementTimeRef.current.set(key, Date.now());
        debounceTimersRef.current.delete(key);
      }, debounceMs);
      
      debounceTimersRef.current.set(key, timer);
    }
  }, [announce, debounceMs]);

  const clear = useCallback(() => {
    setAnnouncements([]);
    lastAnnouncementTimeRef.current.clear();
    debounceTimersRef.current.forEach(timer => clearTimeout(timer));
    debounceTimersRef.current.clear();
  }, []);

  return {
    announcements,
    announce,
    announceValue,
    clear,
  };
}

/**
 * Format value with unit for screen reader announcement
 */
function formatValueForAnnouncement(label: string, value: number, unit: string): string {
  const roundedValue = Math.round(value);
  
  let formattedUnit: string;
  switch (unit) {
    case 'PSI':
      formattedUnit = 'pounds per square inch';
      break;
    case 'GPM':
      formattedUnit = 'gallons per minute';
      break;
    case 'RPM':
      formattedUnit = 'revolutions per minute';
      break;
    case '%':
      formattedUnit = 'percent';
      break;
    case '°F':
      formattedUnit = 'degrees Fahrenheit';
      break;
    case 'gal':
      formattedUnit = 'gallons';
      break;
    case '"Hg':
      formattedUnit = 'inches of mercury';
      break;
    default:
      formattedUnit = unit;
  }
  
  return `${label}: ${roundedValue} ${formattedUnit}`;
}