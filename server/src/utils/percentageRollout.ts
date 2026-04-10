import { createHash } from 'crypto';

/**
 * Deterministic percentage rollout using MD5 hash.
 * Same user + flag always produces the same bucket (0-99).
 */
export function getUserBucket(userId: number | string, flagName: string): number {
  const input = `${flagName}:${userId}`;
  const hash = createHash('md5').update(input).digest('hex');
  const numericValue = parseInt(hash.substring(0, 8), 16);
  return numericValue % 100;
}

export function isUserInPercentage(
  userId: number | string,
  flagName: string,
  percentage: number,
): boolean {
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;
  return getUserBucket(userId, flagName) < percentage;
}
