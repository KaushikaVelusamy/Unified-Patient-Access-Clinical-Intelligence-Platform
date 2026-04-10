/**
 * AccessibleRadioGroup Component
 *
 * Radio button group wrapped in a <fieldset>/<legend>, with
 * proper label association and keyboard support (arrow keys
 * handled natively by the browser).
 *
 * @module forms/AccessibleRadio
 * @task US_043 TASK_003
 */

import React from 'react';
import './accessible-forms.css';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AccessibleRadioGroupProps {
  /** Group legend / question text */
  legend: string;
  /** Shared name attribute */
  name: string;
  /** Currently selected value */
  value: string;
  /** Change handler receiving the selected value */
  onChange: (value: string) => void;
  /** Available options */
  options: RadioOption[];
  /** Mark field as required */
  required?: boolean;
  /** Validation error message */
  error?: string;
}

export const AccessibleRadioGroup: React.FC<AccessibleRadioGroupProps> = ({
  legend,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
}) => {
  const errorId = `${name}-error`;

  return (
    <fieldset
      className="a11y-radio-group"
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="a11y-field__label">
        {legend}
        {required && (
          <span className="a11y-field__required" aria-label="required">
            *
          </span>
        )}
      </legend>

      {options.map((opt) => {
        const radioId = `${name}-${opt.value}`;
        return (
          <div key={opt.value} className="a11y-radio">
            <input
              type="radio"
              id={radioId}
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={opt.disabled}
              aria-required={required || undefined}
            />
            <label htmlFor={radioId} className="a11y-radio__label">
              {opt.label}
            </label>
          </div>
        );
      })}

      {error && (
        <p id={errorId} className="a11y-field__error" role="alert" aria-live="assertive">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </fieldset>
  );
};

export default AccessibleRadioGroup;
