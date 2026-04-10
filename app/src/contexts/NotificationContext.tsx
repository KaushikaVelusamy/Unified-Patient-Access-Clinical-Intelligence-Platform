/**
 * NotificationContext
 *
 * Global state provider for real-time notifications.
 * Manages notification list, unread count, popup queue, panel state,
 * and WebSocket connection status.
 *
 * @module NotificationContext
 * @created 2026-04-09
 * @task US_046 TASK_001
 */

import React, { createContext, useReducer, useCallback, useRef } from 'react';
import type { Notification } from '../types/notification.types';

const MAX_VISIBLE_POPUPS = 3;
const PAGE_SIZE = 20;

interface NotificationState {
  notifications: Notification[];
  popups: Notification[];
  popupQueue: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isPanelOpen: boolean;
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'ACKNOWLEDGE'; payload: string }
  | { type: 'DISMISS_POPUP'; payload: string }
  | { type: 'PROMOTE_QUEUED_POPUP' }
  | { type: 'CLEAR_READ' }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_PANEL_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'APPEND_PAGE'; payload: { notifications: Notification[]; hasMore: boolean } };

const initialState: NotificationState = {
  notifications: [],
  popups: [],
  popupQueue: [],
  unreadCount: 0,
  isConnected: false,
  isPanelOpen: false,
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
};

function recalcUnread(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const exists = state.notifications.some((n) => n.id === action.payload.id);
      if (exists) return state;

      const updated = [action.payload, ...state.notifications];

      // Critical popups go to front, others queue if at max
      let popups = [...state.popups];
      let popupQueue = [...state.popupQueue];

      if (action.payload.priority === 'critical') {
        popups = [action.payload, ...popups].slice(0, MAX_VISIBLE_POPUPS);
        if (state.popups.length >= MAX_VISIBLE_POPUPS) {
          const displaced = state.popups[state.popups.length - 1];
          if (displaced && displaced.priority !== 'critical') {
            popupQueue = [displaced, ...popupQueue];
          }
        }
      } else if (popups.length < MAX_VISIBLE_POPUPS) {
        popups = [...popups, action.payload];
      } else {
        popupQueue = [...popupQueue, action.payload];
      }

      return {
        ...state,
        notifications: updated,
        popups,
        popupQueue,
        unreadCount: recalcUnread(updated),
      };
    }

    case 'SET_NOTIFICATIONS': {
      return {
        ...state,
        notifications: action.payload,
        unreadCount: recalcUnread(action.payload),
      };
    }

    case 'MARK_AS_READ': {
      const updated = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, read: true } : n,
      );
      return { ...state, notifications: updated, unreadCount: recalcUnread(updated) };
    }

    case 'MARK_ALL_AS_READ': {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      return { ...state, notifications: updated, unreadCount: 0 };
    }

    case 'ACKNOWLEDGE': {
      const updated = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, acknowledged: true, read: true } : n,
      );
      const popups = state.popups.filter((p) => p.id !== action.payload);
      return {
        ...state,
        notifications: updated,
        popups,
        unreadCount: recalcUnread(updated),
      };
    }

    case 'DISMISS_POPUP': {
      const popups = state.popups.filter((p) => p.id !== action.payload);
      return { ...state, popups };
    }

    case 'PROMOTE_QUEUED_POPUP': {
      if (state.popupQueue.length === 0 || state.popups.length >= MAX_VISIBLE_POPUPS) {
        return state;
      }
      const [next, ...rest] = state.popupQueue;
      return {
        ...state,
        popups: [...state.popups, next],
        popupQueue: rest,
      };
    }

    case 'CLEAR_READ': {
      const updated = state.notifications.filter((n) => !n.read);
      return { ...state, notifications: updated, unreadCount: recalcUnread(updated) };
    }

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    case 'SET_PANEL_OPEN':
      return { ...state, isPanelOpen: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'APPEND_PAGE': {
      const merged = [...state.notifications];
      for (const n of action.payload.notifications) {
        if (!merged.some((m) => m.id === n.id)) {
          merged.push(n);
        }
      }
      return {
        ...state,
        notifications: merged,
        unreadCount: recalcUnread(merged),
        page: state.page + 1,
        hasMore: action.payload.hasMore,
      };
    }

    default:
      return state;
  }
}

export interface NotificationContextValue {
  state: NotificationState;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  acknowledge: (id: string) => void;
  dismissPopup: (id: string) => void;
  clearRead: () => void;
  setConnected: (connected: boolean) => void;
  togglePanel: () => void;
  closePanel: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  appendPage: (notifications: Notification[], hasMore: boolean) => void;
  lastSyncRef: React.MutableRefObject<string>;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const lastSyncRef = useRef<string>(new Date().toISOString());

  const addNotification = useCallback((notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    lastSyncRef.current = new Date().toISOString();
  }, []);

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  }, []);

  const acknowledge = useCallback((id: string) => {
    dispatch({ type: 'ACKNOWLEDGE', payload: id });
    // Promote queued popup after dismissal
    setTimeout(() => dispatch({ type: 'PROMOTE_QUEUED_POPUP' }), 300);
  }, []);

  const dismissPopup = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_POPUP', payload: id });
    setTimeout(() => dispatch({ type: 'PROMOTE_QUEUED_POPUP' }), 300);
  }, []);

  const clearRead = useCallback(() => {
    dispatch({ type: 'CLEAR_READ' });
  }, []);

  const setConnected = useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  }, []);

  const togglePanel = useCallback(() => {
    dispatch({ type: 'SET_PANEL_OPEN', payload: !state.isPanelOpen });
  }, [state.isPanelOpen]);

  const closePanel = useCallback(() => {
    dispatch({ type: 'SET_PANEL_OPEN', payload: false });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setNotifications = useCallback((notifications: Notification[]) => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  }, []);

  const appendPage = useCallback((notifications: Notification[], hasMore: boolean) => {
    dispatch({ type: 'APPEND_PAGE', payload: { notifications, hasMore } });
  }, []);

  const value: NotificationContextValue = {
    state,
    addNotification,
    markAsRead,
    markAllAsRead,
    acknowledge,
    dismissPopup,
    clearRead,
    setConnected,
    togglePanel,
    closePanel,
    setLoading,
    setError,
    setNotifications,
    appendPage,
    lastSyncRef,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
