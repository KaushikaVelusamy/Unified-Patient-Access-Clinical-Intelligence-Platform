/**
 * ValidationSummary Component
 *
 * Displays a list of form errors with clickable links that focus the
 * offending field. Rendered at the top of a form after a failed submission.
 *
 * Meets WCAG 3.3.1 (Error Identification) and 3.3.3 (Error Suggestion).
 *
 * @module forms/ValidationSummary
 * @task US_043 TASK_003
 */

import React, { useRef, useEffect } from 'react';
import './accessible-forms.css';

export interface FieldError {
  /** Field name or identifier */
  field: string;
  /** Human-readable error message */
  message: string;
}

export interface ValidationSummaryProps {
  /** Array of field-level errors to display */
  errors: FieldError[];
  /** Called when user clicks an error link (should focus the field) */
  onFieldFocus?: (field: string) => void;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  onFieldFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus the summary container when errors appear so screen readers announce it
  useEffect(() => {
    if (errors.length > 0) {
      containerRef.current?.focus();
    }
  }, [errors.length]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="a11y-validation-summary"
      role="alert"
      aria-labelledby="validation-summary-title"
      tabIndex={-1}
    >
      <h3 id="validation-summary-title" className="a11y-validation-summary__title">
        Please correct the following {errors.length} error{errors.length !== 1 ? 's' : ''}:
      </h3>
      <ul className="a11y-validation-summary__list">
        {errors.map((err, idx) => (
          <li key={idx}>
            {onFieldFocus ? (
              <button
                type="button"
                className="a11y-validation-summary__link"
                onClick={() => onFieldFocus(err.field)}
              >
                {err.field}: {err.message}
              </button>
            ) : (
              <span>
                {err.field}: {err.message}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationSummary;
