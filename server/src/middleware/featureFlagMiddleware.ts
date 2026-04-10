import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import featureFlagService from '../services/featureFlagService';
import { FlagEvaluationContext, FLAG_DEFINITIONS } from '../config/featureFlags';
import logger from '../utils/logger';

/**
 * Express middleware that attaches `req.evaluateFlag(flagName)` helper
 * so route handlers can lazily evaluate feature flags for the current user.
 */
export const featureFlagMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const context: FlagEvaluationContext = {
    userId: req.user?.userId ?? 0,
    role: req.user?.role,
    department: (req.user as any)?.department,
    isBetaTester: (req.user as any)?.isBetaTester,
  };

  // Attach lazy evaluator
  (req as any).evaluateFlag = async (flagName: string) => {
    try {
      const result = await featureFlagService.evaluateFlag(flagName, context);
      return result.value;
    } catch (err) {
      logger.warn('Flag evaluation failed in middleware', { flagName, err });
      return FLAG_DEFINITIONS[flagName]?.default ?? false;
    }
  };

  next();
};

export default featureFlagMiddleware;
