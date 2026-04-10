/**
 * FormError Component
 *
 * Standalone inline error / warning message with appropriate
 * ARIA live region politeness level.
 *
 * - `error`   → role="alert" + aria-live="assertive"
 * - `warning` → role="status" + aria-live="polite"
 *
 * @module forms/FormError
 * @task US_043 TASK_003
 */

import React from 'react';
import './accessible-forms.css';

export interface FormErrorProps {
  /** Error or warning message text */
  message: string;
  /** Severity controls ARIA politeness level */
  severity?: 'error' | 'warning';
}

export const FormError: React.FC<FormErrorProps> = ({
  message,
  severity = 'error',
}) => {
  const isError = severity === 'error';

  return (
    <p
      className={`a11y-field__error ${!isError ? 'a11y-field__error--warning' : ''}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <span aria-hidden="true">{isError ? '⚠' : 'ℹ'}</span> {message}
    </p>
  );
};

export default FormError;
