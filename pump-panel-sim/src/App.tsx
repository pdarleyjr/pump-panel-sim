/**
 * Main application component
 * 
 * ⚠️ WARNING: Only Panel.tsx is rendered here. Do not edit legacy panel files.
 * All UI changes must be made to src/ui/Panel.tsx to be reflected in the simulator.
 */

import React from 'react';
import Panel from './ui/Panel';
import './App.css';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong!</h1>
          <p>Check the console for details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log('App rendering');
  return (
    <ErrorBoundary>
      <Panel />
    </ErrorBoundary>
  );
}