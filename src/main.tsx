import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { connectBridge, type Bridge } from './lib/bridge';

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

if (isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

// Expose the resolved bridge on window for Phase B — the hook will read it
// on mount. Phase A wires up connectBridge but doesn't change app behavior.
declare global {
  interface Window {
    __opsetteBridge?: Bridge | null;
  }
}

connectBridge().then((bridge) => {
  window.__opsetteBridge = bridge;
  createRoot(document.getElementById('root')!).render(<App />);
});
