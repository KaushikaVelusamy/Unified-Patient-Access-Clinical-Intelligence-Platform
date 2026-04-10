/**
 * AccessibleInput Component
 *
 * Text input with proper label association, required indicators,
 * inline error messages with ARIA live regions, and help text
 * linked via aria-describedby.
 *
 * Meets WCAG 3.3.2 (Labels or Instructions) and
 * WCAG 3.3.1 (Error Identification).
 *
 * @module forms/AccessibleInput
 * @task US_043 TASK_003
 */

import React, { useId, forwardRef } from 'react';
import './accessible-forms.css';

export interface AccessibleInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Visible label text */
  label: string;
  /** Controlled value */
  value?: string;
  /** Change handler receiving the new value */
  onChange?: (value: string) => void;
  /** Native change handler (alternative) */
  onChangeNative?: React.ChangeEventHandler<HTMLInputElement>;
  /** Mark field as required (adds asterisk + aria-required) */
  required?: boolean;
  /** Validation error message (triggers aria-invalid + alert) */
  error?: string;
  /** Descriptive help text shown below the label */
  helpText?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      value,
      onChange,
      onChangeNative,
      required = false,
      error,
      helpText,
      type = 'text',
      id: externalId,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = externalId ?? generatedId;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    const describedBy: string[] = [];
    if (error) describedBy.push(errorId);
    if (helpText) describedBy.push(helpId);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      if (onChangeNative) {
        onChangeNative(e);
      } else if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className={`a11y-field ${error ? 'a11y-field--error' : ''}`}>
        <label htmlFor={inputId} className="a11y-field__label">
          {label}
          {required && (
            <span className="a11y-field__required" aria-label="required">
              *
            </span>
          )}
        </label>

        {helpText && (
          <p id={helpId} className="a11y-field__help">
            {helpText}
          </p>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={handleChange}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
          className={`a11y-field__input ${error ? 'a11y-field__input--error' : ''} ${className}`}
          {...rest}
        />

        {error && (
          <p id={errorId} className="a11y-field__error" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}
      </div>
    );
  },
);

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
