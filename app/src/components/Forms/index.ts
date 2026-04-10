/**
 * Accessible Form Components – barrel export
 * @module forms
 * @task US_043 TASK_003
 */

export { AccessibleInput } from './AccessibleInput';
export type { AccessibleInputProps } from './AccessibleInput';

export { AccessibleSelect } from './AccessibleSelect';
export type { AccessibleSelectProps, SelectOption, SelectOptionGroup } from './AccessibleSelect';

export { AccessibleCheckbox } from './AccessibleCheckbox';
export type { AccessibleCheckboxProps } from './AccessibleCheckbox';

export { AccessibleRadioGroup } from './AccessibleRadio';
export type { AccessibleRadioGroupProps, RadioOption } from './AccessibleRadio';

export { FormError } from './FormError';
export type { FormErrorProps } from './FormError';

export { ValidationSummary } from './ValidationSummary';
export type { ValidationSummaryProps, FieldError } from './ValidationSummary';

/**
 * Common autocomplete attribute values for HTML5 autofill support.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
 */
export const AUTOCOMPLETE = {
  email: 'email',
  currentPassword: 'current-password',
  newPassword: 'new-password',
  firstName: 'given-name',
  lastName: 'family-name',
  fullName: 'name',
  phone: 'tel',
  addressLine1: 'address-line1',
  addressLine2: 'address-line2',
  city: 'address-level2',
  state: 'address-level1',
  zip: 'postal-code',
  country: 'country-name',
  birthday: 'bday',
  organization: 'organization',
} as const;
