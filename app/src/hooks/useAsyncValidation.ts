import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from './useDebounce';

interface UseAsyncValidationOptions {
  delay?: number;
}

interface UseAsyncValidationReturn {
  isValidating: boolean;
  validationError: string | null;
  validate: (value: string) => void;
  reset: () => void;
}

export function useAsyncValidation(
  validationFn: (value: string) => Promise<string | null>,
  options: UseAsyncValidationOptions = {}
): UseAsyncValidationReturn {
  const { delay = 500 } = options;
  const [inputValue, setInputValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const debouncedValue = useDebounce(inputValue, delay);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!debouncedValue) {
      setValidationError(null);
      setIsValidating(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsValidating(true);

    validationFn(debouncedValue)
      .then((error) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setValidationError(error);
          setIsValidating(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && mountedRef.current) {
          if (err instanceof Error && err.name === 'AbortError') return;
          setValidationError('Unable to validate - check connection');
          setIsValidating(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedValue, validationFn]);

  const validate = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const reset = useCallback(() => {
    setInputValue('');
    setValidationError(null);
    setIsValidating(false);
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return { isValidating, validationError, validate, reset };
}
