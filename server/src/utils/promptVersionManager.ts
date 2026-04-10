/**
 * Prompt Version Manager
 *
 * Loads versioned prompt files from the prompts/ directory with in-memory
 * caching and automatic fallback to v1 when a requested version is missing.
 *
 * @module utils/promptVersionManager
 * @task US_049 task_002 - AI Services Flag Integration
 */

import fs from 'fs';
import path from 'path';
import logger from './logger';

const promptCache = new Map<string, string>();

/**
 * Resolve the base prompts directory.
 * Supports both compiled (dist/) and source (src/) layouts.
 */
function getPromptsDir(): string {
  return path.resolve(__dirname, '..', 'prompts');
}

/**
 * Load a prompt template by category and version.
 *
 * @param category  Sub-folder under prompts/ (e.g. 'medical-coding')
 * @param version   Version tag (e.g. 'v1', 'v2')
 * @returns The prompt text, falling back to v1 if the requested version is missing.
 */
export async function loadPrompt(category: string, version: string): Promise<string> {
  const cacheKey = `${category}:${version}`;
  const cached = promptCache.get(cacheKey);
  if (cached) return cached;

  const promptsDir = getPromptsDir();
  const fileName = `coding-prompt-${version}.txt`;
  const filePath = path.join(promptsDir, category, fileName);

  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    promptCache.set(cacheKey, content);
    logger.info('Loaded prompt version', { category, version, filePath });
    return content;
  } catch {
    if (version !== 'v1') {
      logger.warn('Prompt version not found, falling back to v1', {
        category,
        requestedVersion: version,
        missingFile: filePath,
      });
      return loadPrompt(category, 'v1');
    }

    logger.error('Default prompt v1 not found', { category, filePath });
    throw new Error(`Prompt file not found: ${filePath}`);
  }
}

/**
 * Invalidate cached prompts — useful after prompt file updates.
 */
export function invalidatePromptCache(category?: string): void {
  if (category) {
    for (const key of promptCache.keys()) {
      if (key.startsWith(`${category}:`)) {
        promptCache.delete(key);
      }
    }
  } else {
    promptCache.clear();
  }
}
