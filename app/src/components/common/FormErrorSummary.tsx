/**
 * FormErrorSummary Component
 *
 * Displays a dismissible red banner at the top of a form listing all
 * current validation errors. Each error is a clickable link that scrolls
 * to the offending field and focuses it.
 *
 * @module FormErrorSummary
 * @created 2026-04-09
 * @task US_047 TASK_001
 */

import { useCallback } from 'react';

export interface FormError {
  /** Field name (used for scrolling / focusing) */
  field: string;
  /** Human-readable error message */
  message: string;
}

export interface FormErrorSummaryProps {
  /** Array of field-level errors */
  errors: FormError[];
  /** Callback when the dismiss button is clicked */
  onDismiss?: () => void;
  /** Optional custom CSS class */
  className?: string;
  /** Optional test ID */
  testId?: string;
}

export function FormErrorSummary({
  errors,
  onDismiss,
  className = '',
  testId,
}: FormErrorSummaryProps) {
  const handleFieldClick = useCallback(
    (field: string) => {
      const el =
        document.getElementById(field) ??
        document.querySelector(`[name="${field}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (el as HTMLElement).focus();
      }
    },
    [],
  );

  if (!errors || errors.length === 0) return null;

  return (
    <div
      className={`form-error-summary ${className}`.trim()}
      role="alert"
      aria-live="assertive"
      data-testid={testId}
    >
      <div className="form-error-summary__header">
        <span className="form-error-summary__icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </span>
        <span className="form-error-summary__title">
          Please fix {errors.length} error{errors.length !== 1 ? 's' : ''} to continue:
        </span>
        {onDismiss && (
          <button
            type="button"
            className="form-error-summary__dismiss"
            onClick={onDismiss}
            aria-label="Dismiss error summary"
          >
            ×
          </button>
        )}
      </div>
      <ul className="form-error-summary__list">
        {errors.map((err) => (
          <li key={err.field} className="form-error-summary__item">
            <button
              type="button"
              className="form-error-summary__link"
              onClick={() => handleFieldClick(err.field)}
            >
              {err.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
