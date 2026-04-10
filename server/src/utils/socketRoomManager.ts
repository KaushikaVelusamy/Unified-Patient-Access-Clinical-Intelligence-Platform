/**
 * Socket Room Manager
 *
 * Manages user-specific Socket.io rooms for targeted notification
 * broadcasting. Each user joins room `user:<userId>`.
 *
 * @module socketRoomManager
 * @task US_046 TASK_002
 */

import type { Socket, Server as IoServer } from 'socket.io';
import logger from '../utils/logger';

/** In-memory map of userId → last active (disconnect) timestamp */
const lastActiveTimestamps: Map<number, number> = new Map();

/**
 * Join a socket to the user-specific room.
 */
export function joinUserRoom(socket: Socket, userId: number): void {
  const room = `user:${userId}`;
  socket.join(room);
  logger.debug('Socket joined user room', {
    socketId: socket.id,
    userId,
    room,
  });
}

/**
 * Remove a socket from the user-specific room.
 */
export function leaveUserRoom(socket: Socket, userId: number): void {
  const room = `user:${userId}`;
  socket.leave(room);
  logger.debug('Socket left user room', {
    socketId: socket.id,
    userId,
    room,
  });
}

/**
 * Return the number of active sockets in a user's room.
 */
export function getActiveUsersInRoom(io: IoServer, userId: number): number {
  const room = `user:${userId}`;
  return io.sockets.adapter.rooms.get(room)?.size ?? 0;
}

/**
 * Return all user IDs that currently have at least one active connection.
 */
export function listActiveUsers(io: IoServer): number[] {
  const activeUsers: Set<number> = new Set();
  for (const [, socket] of io.sockets.sockets) {
    const uid = socket.data.userId as number | undefined;
    if (uid !== undefined) {
      activeUsers.add(uid);
    }
  }
  return Array.from(activeUsers);
}

/**
 * Record last active timestamp for a user on disconnect.
 */
export function setLastActive(userId: number, timestamp: number): void {
  lastActiveTimestamps.set(userId, timestamp);
}

/**
 * Retrieve last active timestamp for a user (for missed-notification sync).
 */
export function getLastActive(userId: number): number | undefined {
  return lastActiveTimestamps.get(userId);
}
