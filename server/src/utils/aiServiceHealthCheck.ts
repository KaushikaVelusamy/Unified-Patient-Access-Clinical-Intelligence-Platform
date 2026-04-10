/**
 * AI Service Health Check Utility
 *
 * Tests OpenAI API reachability with a lightweight models.list() call
 * and a 5-second timeout. Returns availability, latency, and any error.
 *
 * @module utils/aiServiceHealthCheck
 * @task US_050 task_002 - Health Check Enhancement
 */

import logger from './logger';

export interface AIServiceHealthStatus {
  configured: boolean;
  available: boolean;
  latency: number | null;
  error: string | null;
}

const AI_HEALTH_TIMEOUT_MS = 5000;

/**
 * Check OpenAI API reachability using the models.list() endpoint.
 * Skips the check entirely when OPENAI_API_KEY is not set.
 */
export async function checkAIServiceHealth(): Promise<AIServiceHealthStatus> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { configured: false, available: true, latency: null, error: null };
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_HEALTH_TIMEOUT_MS);

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    if (response.ok) {
      return { configured: true, available: true, latency, error: null };
    }

    const errorText = response.status === 401
      ? 'Invalid API key'
      : `HTTP ${response.status}`;

    logger.warn('AI service health check returned non-OK status', {
      status: response.status,
      latency,
    });

    return { configured: true, available: false, latency, error: errorText };
  } catch (err: unknown) {
    const latency = Date.now() - startTime;
    const message =
      err instanceof DOMException && err.name === 'AbortError'
        ? `Timeout after ${AI_HEALTH_TIMEOUT_MS}ms`
        : err instanceof Error
          ? err.message
          : 'Unknown error';

    logger.warn('AI service health check failed', { error: message, latency });

    return { configured: true, available: false, latency, error: message };
  }
}
