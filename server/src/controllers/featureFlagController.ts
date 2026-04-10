import { Request, Response } from 'express';
import featureFlagService from '../services/featureFlagService';
import { FLAG_DEFINITIONS, TargetingRule } from '../config/featureFlags';
import { pool } from '../config/database';
import logger from '../utils/logger';

/** GET /api/admin/feature-flags */
export async function listFlags(_req: Request, res: Response): Promise<void> {
  try {
    const flags = await featureFlagService.getAllFlags();
    res.json({ success: true, data: flags });
  } catch (err) {
    logger.error('listFlags failed', err);
    res.status(500).json({ success: false, message: 'Failed to list feature flags' });
  }
}

/** GET /api/admin/feature-flags/:flagName */
export async function getFlag(req: Request, res: Response): Promise<void> {
  const flagName = req.params.flagName as string;

  if (!FLAG_DEFINITIONS[flagName]) {
    res.status(404).json({ success: false, message: `Unknown flag: ${flagName}` });
    return;
  }

  try {
    const config = await featureFlagService.getFlag(flagName);
    res.json({
      success: true,
      data: {
        name: flagName,
        definition: FLAG_DEFINITIONS[flagName],
        config,
      },
    });
  } catch (err) {
    logger.error('getFlag failed', { flagName, err });
    res.status(500).json({ success: false, message: 'Failed to get flag' });
  }
}

/** PUT /api/admin/feature-flags/:flagName */
export async function updateFlag(req: Request, res: Response): Promise<void> {
  const flagName = req.params.flagName as string;

  if (!FLAG_DEFINITIONS[flagName]) {
    res.status(404).json({ success: false, message: `Unknown flag: ${flagName}` });
    return;
  }

  const { value, enabled, targeting, scope, scopeId } = req.body;

  if (value === undefined && enabled === undefined && targeting === undefined) {
    res.status(400).json({ success: false, message: 'Provide at least one of: value, enabled, targeting' });
    return;
  }

  // Validate targeting rule
  if (targeting) {
    const validTypes = ['all', 'beta_testers', 'department', 'role', 'percentage', 'user'];
    if (!validTypes.includes(targeting.type)) {
      res.status(400).json({ success: false, message: `Invalid targeting type. Must be one of: ${validTypes.join(', ')}` });
      return;
    }
  }

  try {
    const user = (req as any).user;
    await featureFlagService.updateFlag(
      flagName,
      { value, enabled, targeting: targeting as TargetingRule, updatedBy: user?.email },
      scope ?? 'global',
      scopeId,
    );
    res.json({ success: true, message: `Flag ${flagName} updated` });
  } catch (err) {
    logger.error('updateFlag failed', { flagName, err });
    res.status(500).json({ success: false, message: 'Failed to update flag' });
  }
}

/** POST /api/admin/feature-flags/:flagName/invalidate-cache */
export async function invalidateCache(req: Request, res: Response): Promise<void> {
  const flagName = req.params.flagName as string;
  try {
    await featureFlagService.invalidateCache(flagName);
    res.json({ success: true, message: `Cache invalidated for ${flagName}` });
  } catch (err) {
    logger.error('invalidateCache failed', { flagName, err });
    res.status(500).json({ success: false, message: 'Failed to invalidate cache' });
  }
}

/** GET /api/admin/feature-flags/:flagName/analytics */
export async function getFlagAnalytics(req: Request, res: Response): Promise<void> {
  const flagName = req.params.flagName as string;

  if (!FLAG_DEFINITIONS[flagName]) {
    res.status(404).json({ success: false, message: `Unknown flag: ${flagName}` });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT
         new_values->>'evaluated_value' AS evaluated_value,
         new_values->>'target_matched'  AS target_matched,
         COUNT(*)::int                  AS evaluation_count,
         MIN(timestamp)                 AS first_seen,
         MAX(timestamp)                 AS last_seen
       FROM audit_logs
       WHERE action = 'FLAG_EVALUATION'
         AND table_name = 'feature_flags'
         AND new_values->>'flag_name' = $1
       GROUP BY evaluated_value, target_matched
       ORDER BY evaluation_count DESC`,
      [flagName],
    );

    res.json({ success: true, data: { flagName, analytics: result.rows } });
  } catch (err) {
    logger.error('getFlagAnalytics failed', { flagName, err });
    res.status(500).json({ success: false, message: 'Failed to get analytics' });
  }
}
