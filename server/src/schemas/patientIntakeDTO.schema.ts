import { z } from 'zod';

const phoneRegex = /^(\(\d{3}\)\s?\d{3}-\d{4}|\+\d{1,3}\s?\d{3}\s?\d{3}\s?\d{4}|\d{10})$/;

export const PatientIntakeDTOSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID').optional(),

  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),

  dateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date')
    .refine((val) => {
      return new Date(val) < new Date();
    }, 'Date of birth cannot be in the future')
    .refine((val) => {
      const dob = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age >= 18;
    }, 'Patient must be 18 or older'),

  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Phone must be 10 digits')
    .optional(),

  email: z.string()
    .email('Email must include @ and domain (e.g., user@example.com)')
    .max(255, 'Email must be less than 255 characters')
    .optional(),

  medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
  })).optional().default([]),

  allergies: z.array(z.object({
    name: z.string().min(1),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  })).optional().default([]),

  insuranceProvider: z.string().max(100).optional(),
  insuranceMemberId: z.string().max(50).optional(),
});

export type PatientIntakeDTO = z.infer<typeof PatientIntakeDTOSchema>;
