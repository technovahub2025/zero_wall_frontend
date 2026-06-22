import { io } from 'socket.io-client';
import { api } from './api';

function getSocketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;

  const apiBase = api?.defaults?.baseURL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api');
  try {
    const url = new URL(apiBase, window.location.origin);
    return `${url.origin}`;
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
  }
}

export const socket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket'],
});
