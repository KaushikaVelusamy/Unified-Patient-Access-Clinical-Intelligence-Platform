/**
 * WebSocket Authentication Middleware
 *
 * Verifies JWT token from Socket.io handshake query parameter,
 * decodes userId, and attaches it to socket.data.
 * Disconnects with an error on invalid or missing token.
 *
 * @module websocketAuth
 * @task US_046 TASK_002
 */

import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import { verifyToken } from '../utils/tokenGenerator';
import logger from '../utils/logger';

export interface AuthenticatedSocketData {
  userId: number;
  email: string;
  role: string;
  connectedAt: number;
}

/**
 * Socket.io middleware that authenticates the handshake via JWT.
 * Token is expected in `socket.handshake.auth.token` or `socket.handshake.query.token`.
 */
export function websocketAuth(
  socket: Socket,
  next: (err?: ExtendedError) => void,
): void {
  const token =
    (socket.handshake.auth?.token as string | undefined) ??
    (socket.handshake.query?.token as string | undefined);

  if (!token) {
    logger.warn('WebSocket auth failed: no token provided', {
      socketId: socket.id,
    });
    return next(new Error('Authentication error: token required'));
  }

  const payload = verifyToken(token);

  if (!payload) {
    logger.warn('WebSocket auth failed: invalid or expired token', {
      socketId: socket.id,
    });
    return next(new Error('Authentication error: invalid or expired token'));
  }

  socket.data.userId = payload.userId;
  socket.data.email = payload.email;
  socket.data.role = payload.role;
  socket.data.connectedAt = Date.now();

  logger.debug('WebSocket auth successful', {
    socketId: socket.id,
    userId: payload.userId,
    role: payload.role,
  });

  next();
}
