import * as Yup from 'yup';

export type InsuranceProvider = 'BlueCross' | 'Aetna' | 'UnitedHealth' | 'Cigna' | 'Humana';

const INSURANCE_PATTERNS: Record<InsuranceProvider, { regex: RegExp; example: string }> = {
  BlueCross: { regex: /^[A-Z]{3}\d{9}$/, example: 'ABC123456789' },
  Aetna: { regex: /^W\d{8,12}$/, example: 'W12345678' },
  UnitedHealth: { regex: /^\d{9,11}$/, example: '123456789' },
  Cigna: { regex: /^U\d{8}$/, example: 'U12345678' },
  Humana: { regex: /^H\d{8,10}$/, example: 'H12345678' },
};

export function validateInsuranceMemberID(memberId: string, provider: InsuranceProvider): { valid: boolean; error?: string } {
  const pattern = INSURANCE_PATTERNS[provider];
  if (!pattern) {
    return { valid: false, error: `Unknown insurance provider: ${provider}` };
  }
  if (!pattern.regex.test(memberId)) {
    return { valid: false, error: `Invalid member ID format for ${provider}. Example: ${pattern.example}` };
  }
  return { valid: true };
}

export function createInsuranceMemberIDSchema(provider: InsuranceProvider): Yup.StringSchema {
  const pattern = INSURANCE_PATTERNS[provider];
  if (!pattern) {
    return Yup.string().required('Insurance member ID is required');
  }
  return Yup.string()
    .required('Insurance member ID is required')
    .matches(pattern.regex, `Invalid member ID format for ${provider}. Example: ${pattern.example}`);
}

export const insuranceMemberIDSchema = Yup.string()
  .required('Insurance member ID is required')
  .min(6, 'Member ID must be at least 6 characters')
  .max(15, 'Member ID must be less than 15 characters')
  .matches(/^[A-Za-z0-9]+$/, 'Member ID must contain only letters and numbers');

export function getSupportedProviders(): InsuranceProvider[] {
  return Object.keys(INSURANCE_PATTERNS) as InsuranceProvider[];
}
