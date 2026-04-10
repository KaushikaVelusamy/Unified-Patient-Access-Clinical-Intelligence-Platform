/**
 * Accessibility Testing Utilities
 *
 * Helpers for automated WCAG 2.2 AA compliance testing using
 * vitest-axe (axe-core) integrated with Vitest + React Testing Library.
 *
 * Usage:
 *   import { renderWithA11y, expectNoA11yViolations, getA11yReport } from '@utils/accessibility-testing';
 *
 * @module accessibility-testing
 * @task US_043 TASK_001
 */

import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { axe, type AxeMatchers } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import type { AxeResults, Result as AxeViolation, ImpactValue, RunOptions } from 'axe-core';
import type { ReactElement } from 'react';
import { expect } from 'vitest';

// Extend Vitest expect with toHaveNoViolations matcher
expect.extend(matchers);

// Re-export so consumers don't need to import vitest-axe directly
export { axe };

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

export interface A11yRenderResult extends RenderResult {
  a11yResults: AxeResults;
}

export interface A11yReport {
  violations: AxeViolation[];
  violationsBySeverity: Record<string, number>;
  passes: AxeViolation[];
  totalViolations: number;
  totalPasses: number;
}

/**
 * Render a React component and immediately run an axe accessibility scan.
 *
 * @param ui      React element to render
 * @param options RTL render options
 * @param axeOpts axe-core run options (tags, rules, etc.)
 * @returns       Standard RTL result plus `a11yResults`
 */
export async function renderWithA11y(
  ui: ReactElement,
  options?: RenderOptions,
  axeOpts?: RunOptions,
): Promise<A11yRenderResult> {
  const view = render(ui, options);
  const a11yResults = await axe(view.container as HTMLElement, axeOpts);
  return { ...view, a11yResults };
}

/**
 * Assert that the given container has **no** axe violations.
 * Fails the test with a human-readable list when violations are found.
 *
 * @param container DOM element to scan
 * @param axeOpts   axe-core run options
 */
export async function expectNoA11yViolations(
  container: HTMLElement,
  axeOpts?: RunOptions,
): Promise<void> {
  const results = await axe(container, axeOpts);
  expect(results).toHaveNoViolations();
}

/**
 * Return a structured accessibility report for the given container.
 *
 * @param container DOM element to scan
 * @param axeOpts   axe-core run options
 */
export async function getA11yReport(
  container: HTMLElement,
  axeOpts?: RunOptions,
): Promise<A11yReport> {
  const results = await axe(container, axeOpts);

  const violationsBySeverity: Record<string, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  for (const v of results.violations) {
    const impact: ImpactValue | undefined = v.impact ?? undefined;
    const key = impact ?? 'minor';
    violationsBySeverity[key] = (violationsBySeverity[key] ?? 0) + 1;
  }

  return {
    violations: results.violations,
    violationsBySeverity,
    passes: results.passes,
    totalViolations: results.violations.length,
    totalPasses: results.passes.length,
  };
}
