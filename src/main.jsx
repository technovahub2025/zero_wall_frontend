import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import App from './App';
import './index.css';
import './styles/mobile.css';
import './styles/animations.css';
import { useUiStore } from './store/uiStore';

if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL || '/'}service-worker.js`);
    window.__PWA_READY__ = Boolean(registration);
  } catch (error) {
    window.__PWA_READY__ = false;
  }
}

async function cleanupDevServiceWorkers() {
  if (typeof window === 'undefined') return;

  window.__PWA_READY__ = false;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('pg-infra-') || cacheName.includes('pg-infra'))
          .map((cacheName) => window.caches.delete(cacheName)),
      );
    }
  } catch (error) {
    window.__PWA_READY__ = false;
  }
}

function ThemeSync() {
  const theme = useUiStore((state) => state.theme);
  const resolvedTheme = useUiStore((state) => state.resolvedTheme);
  const syncResolvedTheme = useUiStore((state) => state.syncResolvedTheme);

  useEffect(() => {
    syncResolvedTheme();
  }, [theme, syncResolvedTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => syncResolvedTheme();

    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, [theme, syncResolvedTheme]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/test_pg_infrastructure" future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ThemeSync />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

window.__PWA_READY__ = false;
if (import.meta.env.PROD) {
  registerServiceWorker();
} else {
  cleanupDevServiceWorkers();
}
