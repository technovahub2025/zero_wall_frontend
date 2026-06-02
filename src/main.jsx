import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import App from './App';
import './index.css';
import { useUiStore } from './store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function ThemeSync() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  return null;
}

function ThemeToaster() {
  const theme = useUiStore((state) => state.theme);

  const style =
    theme === 'light'
      ? {
          background: 'rgba(255, 255, 255, 0.96)',
          color: '#0f172a',
          border: '1px solid rgba(148,163,184,0.3)',
          boxShadow: '0 20px 45px rgba(15,23,42,0.12)',
        }
      : {
          background: 'rgba(2, 6, 23, 0.95)',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.08)',
        };

  return <Toaster position="top-right" toastOptions={{ style }} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <ThemeSync />
        <App />
        <ThemeToaster />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
