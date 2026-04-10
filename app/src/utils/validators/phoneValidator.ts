import * as Yup from 'yup';

export function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 0) return '';

  if (raw.startsWith('+')) {
    const countryCode = digits.slice(0, digits.length - 10);
    const number = digits.slice(-10);
    if (number.length <= 3) return `+${countryCode} ${number}`;
    if (number.length <= 6) return `+${countryCode} ${number.slice(0, 3)} ${number.slice(3)}`;
    return `+${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }

  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function isValidUSPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10;
}

export function isValidInternationalPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return value.startsWith('+') && digits.length >= 11 && digits.length <= 15;
}

export const phoneSchema = Yup.string()
  .required('Phone number is required')
  .test(
    'valid-phone',
    'Phone must be 10 digits',
    (value) => {
      if (!value) return false;
      if (value.startsWith('+')) {
        return isValidInternationalPhone(value);
      }
      return isValidUSPhone(value);
    }
  );

export const usPhoneSchema = Yup.string()
  .required('Phone number is required')
  .test(
    'us-phone',
    'Phone must be 10 digits',
    (value) => !!value && isValidUSPhone(value)
  );

export const internationalPhoneSchema = Yup.string()
  .required('Phone number is required')
  .test(
    'international-phone',
    'Please enter a valid international phone number',
    (value) => !!value && isValidInternationalPhone(value)
  );
