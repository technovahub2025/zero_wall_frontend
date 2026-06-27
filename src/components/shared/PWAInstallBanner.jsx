import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../ui/button';

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [pwaReady, setPwaReady] = useState(() => typeof window !== 'undefined' && Boolean(window.__PWA_READY__));

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const interval = window.setInterval(() => setPwaReady(Boolean(window.__PWA_READY__)), 1000);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.clearInterval(interval);
    };
  }, []);

  if (!prompt || dismissed || !pwaReady) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[85] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.95)] p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
        <Download className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[rgb(var(--text))]">Install PG Infrastructure</div>
        <div className="text-xs text-slate-400">Add the app to your device for faster access.</div>
      </div>
      <Button
        size="sm"
        onClick={async () => {
          await prompt.prompt();
          setPrompt(null);
        }}
      >
        Install
      </Button>
      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400" onClick={() => setDismissed(true)} aria-label="Dismiss install banner">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
