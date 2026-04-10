/**
 * AI Model Validator
 *
 * Validates model names from feature flags against whitelists.
 * Returns a safe default when the flag value references a non-existent model.
 *
 * @module utils/modelValidator
 * @task US_049 task_002 - AI Services Flag Integration
 */

import logger from './logger';

export type ModelCategory = 'intake' | 'vision' | 'coding';

const MODEL_WHITELISTS: Record<ModelCategory, { allowed: string[]; default: string }> = {
  intake: {
    allowed: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    default: 'gpt-4-turbo',
  },
  vision: {
    allowed: ['gpt-4-vision-preview', 'gpt-4v', 'gpt-4o'],
    default: 'gpt-4-vision-preview',
  },
  coding: {
    allowed: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    default: 'gpt-4-turbo',
  },
};

/**
 * Validate a model name against the whitelist for a given category.
 * Returns the model if valid, otherwise returns the category default.
 */
export function validateModel(modelName: string | undefined, category: ModelCategory): string {
  const spec = MODEL_WHITELISTS[category];
  if (!spec) {
    logger.error('Unknown model category', { category });
    return 'gpt-4-turbo';
  }

  if (!modelName || typeof modelName !== 'string') {
    return spec.default;
  }

  const trimmed = modelName.trim().toLowerCase();
  const match = spec.allowed.find((m) => m.toLowerCase() === trimmed);

  if (match) {
    return match;
  }

  logger.error('Invalid model version in flag — falling back to default', {
    flagValue: modelName,
    category,
    fallback: spec.default,
    allowedModels: spec.allowed,
  });

  return spec.default;
}

/**
 * Check whether a model name is in the whitelist (no fallback).
 */
export function isModelValid(modelName: string, category: ModelCategory): boolean {
  const spec = MODEL_WHITELISTS[category];
  if (!spec) return false;
  return spec.allowed.some((m) => m.toLowerCase() === modelName.trim().toLowerCase());
}

/**
 * Return the default model for a category.
 */
export function getDefaultModel(category: ModelCategory): string {
  return MODEL_WHITELISTS[category]?.default ?? 'gpt-4-turbo';
}
