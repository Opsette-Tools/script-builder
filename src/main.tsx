import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// When rendered inside an iframe, unregister any existing service worker so
// the host page isn't subject to our cached shell. A standalone load keeps
// the PWA service worker active.
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

createRoot(document.getElementById('root')!).render(<App />);
