import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from '../types';

/**
 * Runs validation middleware and returns errors if any
 * @param validations - Array of validation chains
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => ({
        field: err.type === 'field' ? (err as any).path : 'unknown',
        message: err.msg,
      }));

      return next(
        new ApiError(
          400,
          `Validation failed: ${errorMessages.map((e) => `${e.field} - ${e.message}`).join(', ')}`,
        ),
      );
    }

    next();
  };
};

export default { validate };
