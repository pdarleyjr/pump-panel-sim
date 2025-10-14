/**
 * Visual feedback component for keyboard actions
 * Shows toast notifications when keyboard shortcuts are used
 */

import React, { useEffect, useState } from 'react';
import './KeyboardFeedback.css';

export interface KeyboardFeedbackMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
  duration?: number;
}

interface KeyboardFeedbackProps {
  messages: KeyboardFeedbackMessage[];
  onDismiss: (id: string) => void;
}

/**
 * Component to display keyboard action feedback
 */
export function KeyboardFeedback({ messages, onDismiss }: KeyboardFeedbackProps) {
  return (
    <div className="keyboard-feedback-container">
      {messages.map((msg) => (
        <FeedbackToast
          key={msg.id}
          message={msg}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

/**
 * Individual toast notification
 */
function FeedbackToast({ 
  message, 
  onDismiss 
}: { 
  message: KeyboardFeedbackMessage;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const duration = message.duration || 2000;

  useEffect(() => {
    // Trigger animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onDismiss(message.id);
      }, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [message.id, duration, onDismiss]);

  const typeClass = message.type || 'info';

  return (
    <div 
      className={`keyboard-feedback-toast keyboard-feedback-${typeClass} ${isVisible ? 'visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="keyboard-feedback-icon">
        {typeClass === 'success' && '✓'}
        {typeClass === 'info' && 'ⓘ'}
        {typeClass === 'warning' && '⚠'}
      </div>
      <div className="keyboard-feedback-message">{message.message}</div>
    </div>
  );
}

/**
 * Hook to manage keyboard feedback messages
 */
export function useKeyboardFeedback() {
  const [messages, setMessages] = useState<KeyboardFeedbackMessage[]>([]);

  const showFeedback = (
    message: string,
    type: KeyboardFeedbackMessage['type'] = 'info',
    duration?: number
  ) => {
    const id = `feedback-${Date.now()}-${Math.random()}`;
    const newMessage: KeyboardFeedbackMessage = {
      id,
      message,
      type,
      duration,
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const dismissFeedback = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return {
    messages,
    showFeedback,
    dismissFeedback,
  };
}