import * as Yup from 'yup';
import { isPast, isFuture, differenceInYears, parseISO, isValid } from 'date-fns';

export function isPastDate(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date) && isPast(date);
}

export function isFutureDate(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date) && isFuture(date);
}

export function isAgeAbove18(dobStr: string): boolean {
  const dob = parseISO(dobStr);
  if (!isValid(dob)) return false;
  return differenceInYears(new Date(), dob) >= 18;
}

export function calculateAge(dobStr: string): number | null {
  const dob = parseISO(dobStr);
  if (!isValid(dob)) return null;
  return differenceInYears(new Date(), dob);
}

export const dobSchema = Yup.string()
  .required('Date of birth is required')
  .test(
    'valid-date',
    'Please enter a valid date',
    (value) => !!value && isValid(parseISO(value))
  )
  .test(
    'past-date',
    'Date cannot be in the future',
    (value) => !!value && isPastDate(value)
  )
  .test(
    'age-18',
    'Patient must be 18 or older',
    (value) => !!value && isAgeAbove18(value)
  );

export const appointmentDateSchema = Yup.string()
  .required('Appointment date is required')
  .test(
    'valid-date',
    'Please enter a valid date',
    (value) => !!value && isValid(parseISO(value))
  )
  .test(
    'future-date',
    'Appointment date must be in the future',
    (value) => !!value && isFutureDate(value)
  );
