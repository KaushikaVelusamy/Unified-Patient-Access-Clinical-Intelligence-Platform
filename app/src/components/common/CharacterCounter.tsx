/**
 * CharacterCounter Component
 *
 * Displays "X/Y characters" below an input field with a warning
 * indicator when approaching the maximum length.
 *
 * @module CharacterCounter
 * @created 2026-04-09
 * @task US_047 TASK_001
 */

export interface CharacterCounterProps {
  /** Current character count */
  currentLength: number;
  /** Maximum allowed characters */
  maxLength: number;
  /** Fraction of maxLength at which warning appears (default: 0.8) */
  warningThreshold?: number;
  /** Optional custom CSS class */
  className?: string;
  /** Optional test ID */
  testId?: string;
}

export function CharacterCounter({
  currentLength,
  maxLength,
  warningThreshold = 0.8,
  className = '',
  testId,
}: CharacterCounterProps) {
  const isWarning = currentLength >= maxLength * warningThreshold;
  const isOver = currentLength > maxLength;

  return (
    <span
      className={`char-counter ${isOver ? 'char-counter--over' : isWarning ? 'char-counter--warning' : ''} ${className}`.trim()}
      aria-live="polite"
      aria-atomic="true"
      data-testid={testId}
    >
      {currentLength}/{maxLength} characters
    </span>
  );
}
