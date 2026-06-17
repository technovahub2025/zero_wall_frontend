import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { timerService } from '../services/timerService';
import { useAuthStore } from '../store/authStore';
import { useTimerStore } from '../store/timerStore';

function normalizeLog(log) {
  if (!log) return null;
  return {
    ...log,
    task: log.task || null,
    project: log.project || null,
    stage: log.stage || null,
    user: log.user || null,
    elapsedSeconds: log.elapsedSeconds || Math.max(0, Math.floor((Date.now() - new Date(log.startTime).getTime()) / 1000)),
  };
}

function groupLogsByDate(logs = []) {
  return logs.reduce((acc, log) => {
    const key = new Date(log.date || log.startTime || Date.now()).toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});
}

export function useTimer() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const activeLog = useTimerStore((state) => state.activeLog);
  const isRunning = useTimerStore((state) => state.isRunning);
  const elapsedSeconds = useTimerStore((state) => state.elapsedSeconds);
  const warningLevel = useTimerStore((state) => state.warningLevel);
  const syncing = useTimerStore((state) => state.syncing);
  const setSyncing = useTimerStore((state) => state.setSyncing);
  const setActiveLog = useTimerStore((state) => state.setActiveLog);
  const clearActiveLog = useTimerStore((state) => state.clearActiveLog);
  const startTicker = useTimerStore((state) => state.startTicker);
  const stopTicker = useTimerStore((state) => state.stopTicker);
  const tick = useTimerStore((state) => state.tick);
  const lastWarningLevel = useRef(0);

  const activeQuery = useQuery({
    queryKey: ['timer-active', userId || 'guest'],
    queryFn: timerService.active,
  });

  useEffect(() => {
    setSyncing(activeQuery.isLoading);
    if (activeQuery.data) {
      setActiveLog(normalizeLog(activeQuery.data));
      startTicker();
      tick();
    } else if (activeQuery.data === null) {
      clearActiveLog();
      stopTicker();
    }
  }, [activeQuery.data, activeQuery.isLoading, setSyncing, setActiveLog, clearActiveLog, startTicker, stopTicker, tick]);

  useEffect(() => {
    if (!isRunning) {
      lastWarningLevel.current = 0;
      return;
    }

    if (warningLevel > lastWarningLevel.current) {
      const messages = {
        1: 'Timer running past 30 minutes',
        2: 'Timer running past 1 hour',
        3: 'Timer running past 2 hours',
      };
      toast.error(messages[warningLevel] || 'Timer warning');
      lastWarningLevel.current = warningLevel;
    }
  }, [isRunning, warningLevel]);

  const startMutation = useMutation({
    mutationFn: ({ taskId, projectId, stageId, note }) =>
      timerService.start({ taskId, projectId, stageId, note }),
    onSuccess: (data) => {
      setActiveLog(normalizeLog(data));
      startTicker();
      tick();
      toast.success('Timer started');
      queryClient.invalidateQueries({ queryKey: ['timer-active'] });
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error, variables) => {
      if (!variables?.suppressToast) {
        toast.error(error?.response?.data?.message || error?.message || 'Failed to start timer');
      }
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => timerService.stop(),
    onSuccess: () => {
      clearActiveLog();
      stopTicker();
      toast.success('Timer stopped');
      queryClient.invalidateQueries({ queryKey: ['timer-active'] });
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error, variables) => {
      if (!variables?.suppressToast) {
        toast.error(error?.response?.data?.message || error?.message || 'No active timer to stop');
      }
    },
  });

  const manualMutation = useMutation({
    mutationFn: (payload) => timerService.manual(payload),
    onSuccess: () => {
      toast.success('Manual entry added');
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['timer-active'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: () => toast.error('Failed to save manual entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => timerService.remove(id),
    onSuccess: () => {
      toast.success('Timer log deleted');
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['timer-active'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: () => toast.error('Failed to delete timer log'),
  });

  const logsQuery = useQuery({
    queryKey: ['timer-logs', userId || 'guest'],
    queryFn: () => timerService.mine({ preset: 'last-30-days', page: 1, limit: 100 }),
  });

  const logs = logsQuery.data?.items || [];

  return useMemo(
    () => ({
      activeLog,
      isRunning,
      elapsedSeconds,
      warningLevel,
      syncing,
      logs,
      grouped: groupLogsByDate(logs),
      dailySummary: logsQuery.data?.dailySummary || [],
      activeQuery,
      logsQuery,
      startTimer: (taskId, projectId, stageId, note = '', options = {}) =>
        startMutation.mutateAsync({ taskId, projectId, stageId, note, ...options }),
      stopTimer: (options = {}) => stopMutation.mutateAsync(options),
      addManualLog: (payload) => manualMutation.mutateAsync(payload),
      deleteLog: (id) => deleteMutation.mutateAsync(id),
      refetchActive: () => queryClient.invalidateQueries({ queryKey: ['timer-active'] }),
    }),
    [
      activeLog,
      isRunning,
      elapsedSeconds,
      syncing,
      logs,
      logsQuery.data,
      activeQuery,
      logsQuery,
      startMutation,
      stopMutation,
      manualMutation,
      deleteMutation,
      queryClient,
    ],
  );
}

