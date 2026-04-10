/**
 * SuccessIndicator Component
 *
 * Displays a green checkmark icon to indicate a valid/successful field state.
 * Positioned at the right edge of an input field via absolute positioning.
 *
 * @module SuccessIndicator
 * @created 2026-04-09
 * @task US_047 TASK_001
 */

export interface SuccessIndicatorProps {
  /** Whether the indicator is visible */
  isValid: boolean;
  /** Icon size in pixels (default: 20) */
  size?: number;
  /** Optional custom CSS class */
  className?: string;
  /** Optional test ID */
  testId?: string;
}

export function SuccessIndicator({
  isValid,
  size = 20,
  className = '',
  testId,
}: SuccessIndicatorProps) {
  if (!isValid) return null;

  return (
    <span
      className={`success-indicator ${className}`.trim()}
      aria-label="Valid input"
      role="img"
      data-testid={testId}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="12" fill="#2E7D32" />
        <path
          d="M7 12.5l3 3 7-7"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
