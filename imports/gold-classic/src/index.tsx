// ============================================================================
// GOLD PLATFORM — REACT APPLICATION ENTRY POINT
// ============================================================================

import React from 'react';
import { createRoot } from 'react-dom/client';
import GoldApp from './components/GoldApp';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <GoldApp />
  </React.StrictMode>,
);
