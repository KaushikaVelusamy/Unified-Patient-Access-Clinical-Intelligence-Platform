import { useState, useCallback, useMemo } from 'react';

export interface FormFieldError {
  field: string;
  message: string;
}

interface UseFormErrorTrackingReturn {
  formErrors: FormFieldError[];
  hasErrors: boolean;
  errorCount: number;
  setFieldError: (field: string, message: string | null) => void;
  clearAllErrors: () => void;
  getSubmitTooltip: () => string;
}

export function useFormErrorTracking(): UseFormErrorTrackingReturn {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, message: string | null) => {
    setErrors((prev) => {
      if (message === null) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const formErrors = useMemo<FormFieldError[]>(
    () => Object.entries(errors).map(([field, message]) => ({ field, message })),
    [errors]
  );

  const hasErrors = formErrors.length > 0;
  const errorCount = formErrors.length;

  const getSubmitTooltip = useCallback(() => {
    if (errorCount === 0) return '';
    return `Please fix ${errorCount} error${errorCount === 1 ? '' : 's'}`;
  }, [errorCount]);

  return { formErrors, hasErrors, errorCount, setFieldError, clearAllErrors, getSubmitTooltip };
}
