import NodeCache from 'node-cache';
import redisClient from '../utils/redisClient';
import logger from '../utils/logger';
import { pool } from '../config/database';
import {
  FlagConfig,
  FlagEvaluationContext,
  FLAG_DEFINITIONS,
  FLAG_CACHE_TTL,
  FLAG_POLL_INTERVAL,
  FLAG_REDIS_PREFIX,
} from '../config/featureFlags';
import { evaluateFlag, EvaluationResult } from '../utils/flagEvaluator';

const memoryCache = new NodeCache({ stdTTL: FLAG_CACHE_TTL, checkperiod: 30 });

class FeatureFlagService {
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  /** Start background polling for flag changes (every 30s). */
  startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.refreshCache(), FLAG_POLL_INTERVAL);
    logger.info(`Feature flag polling started (every ${FLAG_POLL_INTERVAL / 1000}s)`);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Evaluate a flag for a given user context.
   * 3-tier: memory → Redis → default.
   */
  async evaluateFlag(
    flagName: string,
    context: FlagEvaluationContext,
  ): Promise<EvaluationResult> {
    const cacheKey = `flagEval:${flagName}:${context.userId}`;

    // Tier 1: in-memory cache
    const cached = memoryCache.get<EvaluationResult>(cacheKey);
    if (cached) return cached;

    // Tier 2: read configs from Redis (user → dept → global)
    const configs = await this.resolveConfigs(flagName, context);

    const definition = FLAG_DEFINITIONS[flagName];
    const result = evaluateFlag(flagName, configs, context, definition);

    // Store in memory cache
    memoryCache.set(cacheKey, result);

    // Async audit log (non-blocking)
    this.logEvaluation(flagName, context.userId, result).catch((err) =>
      logger.warn('Flag audit log failed', { flagName, err }),
    );

    return result;
  }

  /** Get all flag definitions merged with their current global config. */
  async getAllFlags(): Promise<Array<{ name: string; definition: typeof FLAG_DEFINITIONS[string]; config: FlagConfig | null }>> {
    const flags = Object.entries(FLAG_DEFINITIONS).map(async ([name, definition]) => {
      const config = await this.getRedisFlag(`${FLAG_REDIS_PREFIX}:global:${name}`);
      return { name, definition, config };
    });
    return Promise.all(flags);
  }

  /** Get a single flag's global config. */
  async getFlag(flagName: string): Promise<FlagConfig | null> {
    return this.getRedisFlag(`${FLAG_REDIS_PREFIX}:global:${flagName}`);
  }

  /** Update a flag config at a specific scope. */
  async updateFlag(
    flagName: string,
    config: Partial<FlagConfig>,
    scope: 'global' | 'department' | 'user' = 'global',
    scopeId?: string,
  ): Promise<void> {
    if (!FLAG_DEFINITIONS[flagName]) {
      throw new Error(`Unknown flag: ${flagName}`);
    }

    const key = this.buildRedisKey(flagName, scope, scopeId);
    const existing = await this.getRedisFlag(key);

    const updated: FlagConfig = {
      name: flagName,
      value: config.value ?? existing?.value ?? FLAG_DEFINITIONS[flagName].default,
      type: FLAG_DEFINITIONS[flagName].type,
      enabled: config.enabled ?? existing?.enabled ?? true,
      targeting: config.targeting ?? existing?.targeting ?? { type: 'all' },
      updatedAt: new Date().toISOString(),
      updatedBy: config.updatedBy,
    };

    await this.setRedisFlag(key, updated);

    // Invalidate related memory caches
    this.invalidateCachePattern(flagName);
  }

  /** Clear caches for a specific flag or all flags. */
  async invalidateCache(flagName?: string): Promise<void> {
    if (flagName) {
      this.invalidateCachePattern(flagName);
    } else {
      memoryCache.flushAll();
    }
    logger.info('Feature flag cache invalidated', { flagName: flagName ?? 'all' });
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /** Resolve flag configs from Redis in hierarchy order. */
  private async resolveConfigs(
    flagName: string,
    context: FlagEvaluationContext,
  ): Promise<FlagConfig[]> {
    const keys: string[] = [];

    // User-specific
    keys.push(`${FLAG_REDIS_PREFIX}:user:${context.userId}:${flagName}`);

    // Department-specific
    if (context.department) {
      keys.push(`${FLAG_REDIS_PREFIX}:department:${context.department}:${flagName}`);
    }

    // Global
    keys.push(`${FLAG_REDIS_PREFIX}:global:${flagName}`);

    const configs: FlagConfig[] = [];
    for (const key of keys) {
      const cfg = await this.getRedisFlag(key);
      if (cfg) configs.push(cfg);
    }
    return configs;
  }

  private async getRedisFlag(key: string): Promise<FlagConfig | null> {
    if (!redisClient.isAvailable) return null;
    try {
      const raw = await redisClient.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as FlagConfig;
    } catch {
      return null;
    }
  }

  private async setRedisFlag(key: string, config: FlagConfig): Promise<void> {
    if (!redisClient.isAvailable) {
      logger.warn('Redis unavailable — flag update deferred');
      return;
    }
    try {
      await redisClient.set(key, JSON.stringify(config));
    } catch (err) {
      logger.error('Failed to write flag to Redis', { key, err });
    }
  }

  private buildRedisKey(
    flagName: string,
    scope: 'global' | 'department' | 'user',
    scopeId?: string,
  ): string {
    if (scope === 'global') return `${FLAG_REDIS_PREFIX}:global:${flagName}`;
    return `${FLAG_REDIS_PREFIX}:${scope}:${scopeId}:${flagName}`;
  }

  private invalidateCachePattern(flagName: string): void {
    const keys = memoryCache.keys().filter((k) => k.includes(flagName));
    keys.forEach((k) => memoryCache.del(k));
  }

  /** Refresh all global flags from Redis into memory cache. */
  private async refreshCache(): Promise<void> {
    for (const flagName of Object.keys(FLAG_DEFINITIONS)) {
      const key = `${FLAG_REDIS_PREFIX}:global:${flagName}`;
      const cfg = await this.getRedisFlag(key);
      if (cfg) {
        memoryCache.set(`flagGlobal:${flagName}`, cfg);
      }
    }
  }

  /** Async audit log — writes to audit_logs table. */
  private async logEvaluation(
    flagName: string,
    userId: number,
    result: EvaluationResult,
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, timestamp)
         VALUES ($1, $2, $3, NULL, NULL, $4, $5, NOW())`,
        [
          userId,
          'FLAG_EVALUATION',
          'feature_flags',
          JSON.stringify({
            flag_name: flagName,
            evaluated_value: result.value,
            target_matched: result.targetMatched,
          }),
          '127.0.0.1',
        ],
      );
    } catch {
      // Non-blocking — already caught by caller
    }
  }
}

export const featureFlagService = new FeatureFlagService();
export default featureFlagService;
