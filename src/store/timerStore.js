import { create } from 'zustand';

let tickerId = null;

function computeElapsedSeconds(startTime) {
  if (!startTime) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
}

function computeWarningLevel(seconds = 0) {
  const total = Number(seconds) || 0;
  if (total >= 7200) return 3;
  if (total >= 3600) return 2;
  if (total >= 1800) return 1;
  return 0;
}

export const useTimerStore = create((set, get) => ({
  activeLog: null,
  isRunning: false,
  elapsedSeconds: 0,
  warningLevel: 0,
  syncing: false,
  setSyncing: (syncing) => set({ syncing }),
  setActiveLog: (activeLog) =>
    set({
      activeLog,
      isRunning: Boolean(activeLog),
      elapsedSeconds: activeLog ? activeLog.elapsedSeconds || computeElapsedSeconds(activeLog.startTime) : 0,
      warningLevel: activeLog ? computeWarningLevel(activeLog.elapsedSeconds || computeElapsedSeconds(activeLog.startTime)) : 0,
    }),
  clearActiveLog: () =>
    set({
      activeLog: null,
      isRunning: false,
      elapsedSeconds: 0,
      warningLevel: 0,
    }),
  tick: () => {
    const { activeLog } = get();
    if (!activeLog?.startTime) return;
    const elapsedSeconds = computeElapsedSeconds(activeLog.startTime);
    set({ elapsedSeconds, warningLevel: computeWarningLevel(elapsedSeconds) });
  },
  startTicker: () => {
    if (tickerId) return;
    tickerId = setInterval(() => {
      const { activeLog } = get();
      if (!activeLog?.startTime) return;
      const elapsedSeconds = computeElapsedSeconds(activeLog.startTime);
      set({ elapsedSeconds, warningLevel: computeWarningLevel(elapsedSeconds) });
    }, 1000);
  },
  stopTicker: () => {
    if (tickerId) {
      clearInterval(tickerId);
      tickerId = null;
    }
  },
  setWarningLevel: (warningLevel) => set({ warningLevel }),
}));

export function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
