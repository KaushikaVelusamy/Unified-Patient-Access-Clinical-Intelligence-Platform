import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const DocumentUploadDTOSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID'),

  documentType: z.enum(
    ['INSURANCE_CARD', 'LAB_REPORT', 'PRESCRIPTION', 'OTHER'],
    { message: 'Document type must be one of: INSURANCE_CARD, LAB_REPORT, PRESCRIPTION, OTHER' }
  ),

  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters'),

  fileSize: z.number()
    .int('File size must be an integer')
    .positive('File size must be positive')
    .max(MAX_FILE_SIZE, 'File size cannot exceed 10 MB'),

  mimeType: z.string()
    .max(100, 'MIME type must be less than 100 characters')
    .optional(),
});

export type DocumentUploadDTO = z.infer<typeof DocumentUploadDTOSchema>;
