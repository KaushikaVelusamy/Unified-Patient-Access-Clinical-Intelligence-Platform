/**
 * Notification Socket Service
 *
 * Socket.io-based WebSocket service for real-time notification delivery.
 * Creates user-specific rooms, handles connection lifecycle, enforces
 * per-user connection limits, and exposes the io instance for broadcasting.
 *
 * Coexists with the existing ws-based WebSocket service (queue / circuit-breaker).
 *
 * @module notificationSocketService
 * @task US_046 TASK_002
 */

import { Server as HttpServer } from 'http';
import { Server as IoServer } from 'socket.io';
import config from '../config/env';
import logger from '../utils/logger';
import { websocketAuth } from '../middleware/websocketAuth';
import {
  joinUserRoom,
  leaveUserRoom,
  getActiveUsersInRoom,
  setLastActive,
} from '../utils/socketRoomManager';

/** Maximum concurrent socket connections per user */
const MAX_CONNECTIONS_PER_USER = 5;

/** Singleton io instance */
let io: IoServer | null = null;

/**
 * Initialize the Socket.io notification server attached to the HTTP server.
 * Must be called AFTER the HTTP server is created but BEFORE it begins listening.
 */
export function initNotificationSocket(httpServer: HttpServer): IoServer {
  if (io) {
    logger.warn('Notification Socket.io server already initialized');
    return io;
  }

  const allowedOrigins: string[] = [config.frontendUrl];
  if (config.nodeEnv === 'development') {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    );
  }

  io = new IoServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    path: '/notifications',
    transports: ['websocket', 'polling'],
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  // Authentication middleware
  io.use(websocketAuth);

  io.on('connection', (socket) => {
    const userId = socket.data.userId as number;
    const socketId = socket.id;

    // Enforce per-user connection limit
    const currentCount = getActiveUsersInRoom(io!, userId);
    if (currentCount >= MAX_CONNECTIONS_PER_USER) {
      logger.warn('Connection limit exceeded', {
        userId,
        socketId,
        currentConnections: currentCount,
        limit: MAX_CONNECTIONS_PER_USER,
      });
      socket.emit('error', { message: 'Connection limit exceeded' });
      socket.disconnect(true);
      return;
    }

    // Auto-join user room on connect
    joinUserRoom(socket, userId);

    logger.info('Notification socket connected', {
      userId,
      socketId,
      role: socket.data.role,
      activeConnections: getActiveUsersInRoom(io!, userId),
    });

    // Client may explicitly request room join (re-join after reconnect)
    socket.on('user_join', (data?: { userId?: number }) => {
      const requestedId = data?.userId ?? userId;

      // Only allow joining own room (prevent impersonation)
      if (requestedId !== userId) {
        logger.warn('Attempted to join another user room', {
          socketId,
          ownUserId: userId,
          requestedUserId: requestedId,
        });
        socket.emit('error', { message: 'Cannot join another user room' });
        return;
      }

      joinUserRoom(socket, userId);
      socket.emit('room_joined', { userId, room: `user:${userId}` });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      const connectedAt = socket.data.connectedAt as number;
      const duration = Date.now() - connectedAt;

      setLastActive(userId, Date.now());
      leaveUserRoom(socket, userId);

      logger.info('Notification socket disconnected', {
        userId,
        socketId,
        reason,
        durationMs: duration,
        remainingConnections: getActiveUsersInRoom(io!, userId),
      });
    });

    // Handle errors
    socket.on('error', (err) => {
      logger.error('Notification socket error', {
        userId,
        socketId,
        error: err.message,
      });
    });
  });

  logger.info('✓ Notification Socket.io server initialized on /notifications');
  return io;
}

/**
 * Retrieve the singleton Socket.io server instance.
 * Returns null if not yet initialized.
 */
export function getNotificationIO(): IoServer | null {
  return io;
}

/**
 * Gracefully close the notification Socket.io server.
 */
export function closeNotificationSocket(): void {
  if (!io) return;

  io.disconnectSockets(true);
  io.close();
  io = null;
  logger.info('Notification Socket.io server closed');
}
