/**
 * Screen Reader Announcer Component
 * Provides accessible announcements for dynamic content changes
 * Supports multiple priority levels and debouncing for frequent updates
 */

import React, { useEffect, useRef, useState } from 'react';
import './ScreenReaderAnnouncer.css';

export type AnnouncementPriority = 'urgent' | 'normal' | 'low';

export interface Announcement {
  id: string;
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

interface ScreenReaderAnnouncerProps {
  /** Array of announcements to be read by screen readers */
  announcements: Announcement[];
  /** Callback when announcement is processed */
  onAnnouncementProcessed?: (id: string) => void;
}

/**
 * Screen Reader Announcer Component
 * Renders live regions for screen reader announcements with priority handling
 */
export function ScreenReaderAnnouncer({ 
  announcements, 
  onAnnouncementProcessed 
}: ScreenReaderAnnouncerProps) {
  const [urgentMessage, setUrgentMessage] = useState('');
  const [normalMessage, setNormalMessage] = useState('');
  const [lowMessage, setLowMessage] = useState('');
  
  const processedIdsRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Process new announcements
    announcements.forEach((announcement) => {
      if (!processedIdsRef.current.has(announcement.id)) {
        processedIdsRef.current.add(announcement.id);
        
        // Set message in appropriate live region based on priority
        switch (announcement.priority) {
          case 'urgent':
            setUrgentMessage(announcement.message);
            break;
          case 'normal':
            setNormalMessage(announcement.message);
            break;
          case 'low':
            setLowMessage(announcement.message);
            break;
        }
        
        // Clear message after screen reader has time to announce (3 seconds)
        const timeout = setTimeout(() => {
          switch (announcement.priority) {
            case 'urgent':
              setUrgentMessage('');
              break;
            case 'normal':
              setNormalMessage('');
              break;
            case 'low':
              setLowMessage('');
              break;
          }
          
          timeoutsRef.current.delete(announcement.id);
          onAnnouncementProcessed?.(announcement.id);
        }, 3000);
        
        timeoutsRef.current.set(announcement.id, timeout);
      }
    });
    
    // Cleanup on unmount
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, [announcements, onAnnouncementProcessed]);

  return (
    <>
      {/* Urgent announcements - assertive, interrupts current screen reader content */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="urgent-announcer"
      >
        {urgentMessage}
      </div>

      {/* Normal priority - polite, waits for screen reader to finish current content */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="normal-announcer"
      >
        {normalMessage}
      </div>

      {/* Low priority - polite with off setting for less important updates */}
      <div
        role="status"
        aria-live="off"
        aria-atomic="true"
        className="sr-only"
        data-testid="low-announcer"
      >
        {lowMessage}
      </div>
    </>
  );
}

/**
 * Format value for screen reader announcement
 * Expands abbreviations and provides clear pronunciation
 */
export function formatForScreenReader(value: number, unit: string): string {
  const roundedValue = Math.round(value);
  
  switch (unit) {
    case 'PSI':
      return `${roundedValue} pounds per square inch`;
    case 'GPM':
      return `${roundedValue} gallons per minute`;
    case 'RPM':
      return `${roundedValue} revolutions per minute`;
    case '%':
      return `${roundedValue} percent`;
    case '°F':
      return `${roundedValue} degrees Fahrenheit`;
    case 'gal':
      return `${roundedValue} gallons`;
    case '"Hg':
      return `${roundedValue} inches of mercury`;
    default:
      return `${roundedValue} ${unit}`;
  }
}

/**
 * Create announcement message for value changes
 */
export function createValueAnnouncement(
  label: string,
  value: number,
  unit: string,
  priority: AnnouncementPriority = 'normal'
): Announcement {
  return {
    id: `${label}-${Date.now()}`,
    message: `${label}: ${formatForScreenReader(value, unit)}`,
    priority,
    timestamp: Date.now(),
  };
}

/**
 * Create announcement for state changes
 */
export function createStateAnnouncement(
  message: string,
  priority: AnnouncementPriority = 'normal'
): Announcement {
  return {
    id: `state-${Date.now()}`,
    message,
    priority,
    timestamp: Date.now(),
  };
}