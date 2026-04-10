import { z } from 'zod';

export const AppointmentBookingDTOSchema = z.object({
  slotId: z.union([
    z.number().int().positive('Slot ID must be a positive integer'),
    z.string().regex(/^\d+$/, 'Slot ID must be a valid numeric ID').transform(Number),
  ]),

  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable(),

  reason: z.string()
    .max(200, 'Reason cannot exceed 200 characters')
    .optional()
    .nullable(),
});

export type AppointmentBookingDTO = z.infer<typeof AppointmentBookingDTOSchema>;
