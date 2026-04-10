/**
 * useFlagWebSocket Hook
 *
 * Connects to the WebSocket server and listens for real-time
 * feature-flag update events. Shows a toast-style notification
 * when another admin changes a flag, and triggers a flag refresh.
 *
 * @module hooks/useFlagWebSocket
 * @task US_049 task_003 - Admin Feature Flags UI
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getToken } from '../utils/storage/tokenStorage';

const WS_URL = import.meta.env.VITE_WS_URL || '';

export interface FlagUpdateEvent {
  flagName: string;
  updatedBy: string;
  newStatus: boolean;
  timestamp: string;
}

export interface FlagToast {
  id: number;
  message: string;
  timestamp: string;
}

interface UseFlagWebSocketReturn {
  toasts: FlagToast[];
  dismissToast: (id: number) => void;
}

let toastIdCounter = 0;

export function useFlagWebSocket(onFlagUpdate?: () => void): UseFlagWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);
  const [toasts, setToasts] = useState<FlagToast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string) => {
      const id = ++toastIdCounter;
      const toast: FlagToast = { id, message, timestamp: new Date().toISOString() };
      setToasts((prev) => [...prev, toast]);
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        if (mountedRef.current) {
          dismissToast(id);
        }
      }, 5000);
    },
    [dismissToast],
  );

  useEffect(() => {
    mountedRef.current = true;
    const token = getToken();
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on('flag-updated', (data: FlagUpdateEvent) => {
      if (!mountedRef.current) return;
      const status = data.newStatus ? 'enabled' : 'disabled';
      addToast(`${data.flagName} flag ${status} by ${data.updatedBy}`);
      onFlagUpdate?.();
    });

    return () => {
      mountedRef.current = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addToast, onFlagUpdate]);

  return { toasts, dismissToast };
}
