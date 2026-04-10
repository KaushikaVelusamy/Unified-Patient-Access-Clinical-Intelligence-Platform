import {
  FlagConfig,
  FlagDefinition,
  FlagEvaluationContext,
  FLAG_DEFINITIONS,
  TargetingRule,
} from '../config/featureFlags';
import { isUserInPercentage } from './percentageRollout';

export interface EvaluationResult {
  value: boolean | string | number;
  targetMatched: string;
}

/**
 * Evaluate a single flag config against a user context.
 * Returns the flag value if the targeting rule matches, or null if it does not.
 */
function matchesTarget(
  config: FlagConfig,
  context: FlagEvaluationContext,
): boolean {
  if (!config.enabled) return false;

  const rule: TargetingRule = config.targeting;

  switch (rule.type) {
    case 'all':
      return true;

    case 'beta_testers':
      return context.isBetaTester === true;

    case 'department':
      return (
        typeof rule.value === 'string' &&
        context.department?.toLowerCase() === rule.value.toLowerCase()
      );

    case 'role':
      return (
        typeof rule.value === 'string' &&
        context.role?.toLowerCase() === rule.value.toLowerCase()
      );

    case 'percentage':
      return isUserInPercentage(
        context.userId,
        config.name,
        typeof rule.value === 'number' ? rule.value : parseInt(String(rule.value), 10) || 0,
      );

    case 'user':
      return String(context.userId) === String(rule.value);

    default:
      return false;
  }
}

/**
 * Evaluate flag using hierarchy: user-specific → department-specific → global.
 *
 * @param flagName   - The flag identifier
 * @param configs    - Array of resolved FlagConfig objects (user, dept, global)
 * @param context    - Current user context
 * @param definition - Static flag definition (for default value)
 */
export function evaluateFlag(
  flagName: string,
  configs: FlagConfig[],
  context: FlagEvaluationContext,
  definition?: FlagDefinition,
): EvaluationResult {
  // Hierarchy order is determined by the caller (user → dept → global).
  for (const cfg of configs) {
    if (matchesTarget(cfg, context)) {
      return { value: cfg.value, targetMatched: formatTarget(cfg.targeting) };
    }
  }

  // Fallback to static default
  const def = definition ?? FLAG_DEFINITIONS[flagName];
  return {
    value: def ? def.default : false,
    targetMatched: 'default',
  };
}

function formatTarget(rule: TargetingRule): string {
  if (rule.value !== undefined) {
    return `${rule.type}:${rule.value}`;
  }
  return rule.type;
}
