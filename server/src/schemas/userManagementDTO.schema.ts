import { z } from 'zod';

export const UserManagementDTOSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Email must include @ and domain (e.g., user@example.com)')
    .max(255, 'Email must be less than 255 characters'),

  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),

  role: z.enum(
    ['patient', 'staff', 'admin'],
    { message: 'Role must be one of: patient, staff, admin' }
  ),

  active: z.boolean().optional().default(true),

  phone: z.string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .nullable(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .optional(),
});

export const UserUpdateDTOSchema = UserManagementDTOSchema.partial().extend({
  email: z.string()
    .email('Email must include @ and domain (e.g., user@example.com)')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
});

export type UserManagementDTO = z.infer<typeof UserManagementDTOSchema>;
export type UserUpdateDTO = z.infer<typeof UserUpdateDTOSchema>;
