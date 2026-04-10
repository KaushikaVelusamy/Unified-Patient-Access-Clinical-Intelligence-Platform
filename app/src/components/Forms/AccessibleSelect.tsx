/**
 * AccessibleSelect Component
 *
 * Dropdown select with label, required indicator, optgroup support,
 * inline error messages, and help text linked via aria-describedby.
 *
 * @module forms/AccessibleSelect
 * @task US_043 TASK_003
 */

import React, { useId, forwardRef } from 'react';
import './accessible-forms.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface AccessibleSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /** Visible label text */
  label: string;
  /** Flat options (mutually exclusive with optionGroups) */
  options?: SelectOption[];
  /** Grouped options */
  optionGroups?: SelectOptionGroup[];
  /** Controlled value */
  value?: string;
  /** Change handler receiving the new value */
  onChange?: (value: string) => void;
  /** Native change handler (alternative) */
  onChangeNative?: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
  error?: string;
  helpText?: string;
  /** Placeholder text for empty state */
  placeholder?: string;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  (
    {
      label,
      options,
      optionGroups,
      value,
      onChange,
      onChangeNative,
      required = false,
      error,
      helpText,
      placeholder = 'Select an option\u2026',
      id: externalId,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = externalId ?? generatedId;
    const errorId = `${selectId}-error`;
    const helpId = `${selectId}-help`;

    const describedBy: string[] = [];
    if (error) describedBy.push(errorId);
    if (helpText) describedBy.push(helpId);

    const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
      if (onChangeNative) {
        onChangeNative(e);
      } else if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className={`a11y-field ${error ? 'a11y-field--error' : ''}`}>
        <label htmlFor={selectId} className="a11y-field__label">
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

        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={handleChange}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
          className={`a11y-field__select ${error ? 'a11y-field__select--error' : ''} ${className}`}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>

          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}

          {optionGroups?.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {error && (
          <p id={errorId} className="a11y-field__error" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}
      </div>
    );
  },
);

AccessibleSelect.displayName = 'AccessibleSelect';

export default AccessibleSelect;
