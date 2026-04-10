interface AsyncValidationSpinnerProps {
  isValidating: boolean;
  helperText?: string;
  size?: number;
  className?: string;
  testId?: string;
}

export function AsyncValidationSpinner({
  isValidating,
  helperText = 'Checking...',
  size = 20,
  className = '',
  testId,
}: AsyncValidationSpinnerProps) {
  if (!isValidating) return null;

  return (
    <span
      className={`async-validation-spinner ${className}`.trim()}
      aria-label="Validating input"
      role="status"
      aria-live="polite"
      data-testid={testId}
    >
      <svg
        className="async-validation-spinner__icon"
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="#E2E8F0"
          strokeWidth="2.5"
        />
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="#0066CC"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="50.27"
          strokeDashoffset="37.7"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 10 10"
            to="360 10 10"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      {helperText && (
        <span className="async-validation-spinner__text">{helperText}</span>
      )}
    </span>
  );
}
