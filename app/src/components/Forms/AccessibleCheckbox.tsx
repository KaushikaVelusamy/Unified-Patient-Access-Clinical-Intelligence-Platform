/**
 * AccessibleCheckbox Component
 *
 * Checkbox with proper label association, aria-checked, and
 * required indicator.
 *
 * @module forms/AccessibleCheckbox
 * @task US_043 TASK_003
 */

import React, { useId, forwardRef } from 'react';
import './accessible-forms.css';

export interface AccessibleCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Visible label text */
  label: string;
  /** Controlled checked state */
  checked?: boolean;
  /** Change handler receiving the new checked state */
  onChange?: (checked: boolean) => void;
  /** Native change handler (alternative) */
  onChangeNative?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  error?: string;
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  (
    {
      label,
      checked,
      onChange,
      onChangeNative,
      required = false,
      error,
      id: externalId,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = externalId ?? generatedId;

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      if (onChangeNative) {
        onChangeNative(e);
      } else if (onChange) {
        onChange(e.target.checked);
      }
    };

    return (
      <div className="a11y-checkbox">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={handleChange}
          required={required}
          aria-required={required || undefined}
          aria-checked={checked}
          className={`a11y-checkbox__input ${className}`}
          {...rest}
        />
        <label htmlFor={inputId} className="a11y-checkbox__label">
          {label}
          {required && (
            <span className="a11y-field__required" aria-label="required">
              *
            </span>
          )}
        </label>
        {error && (
          <p className="a11y-field__error" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}
      </div>
    );
  },
);

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

export default AccessibleCheckbox;
