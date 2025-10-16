/**
 * Main application component
 */

import { SimulationProvider } from './sim/SimulationContext';
import Panel from './ui/Panel';
import './App.css';

export default function App() {
  return (
    <SimulationProvider>
      <Panel />
    </SimulationProvider>
  );
}