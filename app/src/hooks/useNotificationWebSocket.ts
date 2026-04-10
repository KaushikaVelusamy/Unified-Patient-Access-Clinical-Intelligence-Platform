/**
 * useNotificationWebSocket Hook
 *
 * Connects to the notification WebSocket server using socket.io-client.
 * Listens for "notification" events and feeds them into NotificationContext.
 * Handles reconnection with exponential backoff and fetches
 * missed notifications on reconnect.
 *
 * @module useNotificationWebSocket
 * @created 2026-04-09
 * @task US_046 TASK_001
 */

import { useEffect, useRef, useContext, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { NotificationContext } from '../contexts/NotificationContext';
import { fetchMissedNotifications } from '../services/notificationService';
import { getToken } from '../utils/storage/tokenStorage';
import type { Notification } from '../types/notification.types';

const WS_URL = import.meta.env.VITE_WS_URL || '';

export function useNotificationWebSocket(userId: string | undefined): void {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationWebSocket must be used within a NotificationProvider');
  }

  const { addNotification, setConnected, lastSyncRef } = ctx;
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);

  const handleReconnect = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const missed = await fetchMissedNotifications(lastSyncRef.current);
      for (const n of missed) {
        addNotification(n);
      }
    } catch {
      // Silent — missed notifications will be fetched on next page load
    }
  }, [addNotification, lastSyncRef]);

  useEffect(() => {
    mountedRef.current = true;

    if (!userId) return;

    const token = getToken();
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (!mountedRef.current) return;
      setConnected(true);
      socket.emit('user_join', { userId });
    });

    socket.on('disconnect', () => {
      if (!mountedRef.current) return;
      setConnected(false);
    });

    socket.on('notification', (data: Notification) => {
      if (!mountedRef.current) return;
      addNotification(data);
    });

    socket.io.on('reconnect', () => {
      if (!mountedRef.current) return;
      setConnected(true);
      handleReconnect();
    });

    return () => {
      mountedRef.current = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, addNotification, setConnected, handleReconnect]);
}
