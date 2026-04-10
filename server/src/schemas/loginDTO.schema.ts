import { z } from 'zod';

export const LoginDTOSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Email must include @ and domain (e.g., user@example.com)')
    .max(255, 'Email must be less than 255 characters'),

  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),

  rememberMe: z.boolean().optional().default(false),
});

export type LoginDTO = z.infer<typeof LoginDTOSchema>;
