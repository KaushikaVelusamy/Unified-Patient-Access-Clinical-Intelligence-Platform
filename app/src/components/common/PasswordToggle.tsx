interface PasswordToggleProps {
  showPassword: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

export function PasswordToggle({
  showPassword,
  onToggle,
  disabled = false,
  className = '',
  testId,
}: PasswordToggleProps) {
  return (
    <button
      type="button"
      className={`password-toggle ${className}`.trim()}
      onClick={onToggle}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      tabIndex={0}
      disabled={disabled}
      data-testid={testId}
    >
      {showPassword ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 4C5 4 1.73 7.11 1 10c.73 2.89 4 6 9 6s8.27-3.11 9-6c-.73-2.89-4-6-9-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          <path d="M2 2l16 16" stroke="currentColor" strokeWidth="2" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 4C5 4 1.73 7.11 1 10c.73 2.89 4 6 9 6s8.27-3.11 9-6c-.73-2.89-4-6-9-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      )}
    </button>
  );
}
