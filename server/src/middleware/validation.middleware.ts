import { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { logValidationError } from '../utils/validationErrorLogger';

interface ValidationErrorItem {
  field: string;
  message: string;
  code: string;
}

function formatZodErrors(error: ZodError): ValidationErrorItem[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
    code: mapZodCodeToErrorCode(issue.code, issue.path.join('.')),
  }));
}

function mapZodCodeToErrorCode(zodCode: string, field: string): string {
  const fieldUpper = field.toUpperCase();
  switch (zodCode) {
    case 'invalid_type':
      return `INVALID_${fieldUpper || 'TYPE'}`;
    case 'too_small':
      return `TOO_SHORT_${fieldUpper}`;
    case 'too_big':
      return `TOO_LONG_${fieldUpper}`;
    case 'invalid_string':
      return `INVALID_${fieldUpper}`;
    case 'invalid_enum_value':
      return `INVALID_${fieldUpper}`;
    case 'custom':
      return `CUSTOM_FORMAT_ERROR`;
    default:
      return `VALIDATION_ERROR_${fieldUpper}`;
  }
}

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);

      logValidationError({
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        endpoint: req.originalUrl,
        method: req.method,
        errors,
      });

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = formatZodErrors(result.error);

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
    next();
  };
}
