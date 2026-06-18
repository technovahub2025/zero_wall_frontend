export function getTimerActionLabel(log = {}) {
  if (log.actionLabel) return log.actionLabel;
  if (log.isManual) return 'Manual entry';
  if (log.switchFromLog) return 'Switched to task';
  if (log.switchToTask) return 'Switched from task';
  if (log.pausedAt) return 'Paused';
  if (log.endTime) return 'Stopped';
  return 'Started';
}

export function getTimerReason(log = {}) {
  return String(log.reason || log.switchReason || log.note || '').trim();
}

export function getTimerActionTone(log = {}) {
  const action = String(log.action || getTimerActionLabel(log)).toLowerCase();
  if (action.includes('manual')) return 'amber';
  if (action.includes('switch')) return 'blue';
  if (action.includes('pause')) return 'slate';
  if (action.includes('stop')) return 'rose';
  if (action.includes('start')) return 'green';
  return 'slate';
}
