/**
 * AccessibleDropdown Component
 *
 * Custom dropdown implementing the WAI-ARIA Listbox pattern:
 *  - aria-haspopup="listbox" + aria-expanded on the trigger button
 *  - role="listbox" on the option list
 *  - role="option" + aria-selected on each item
 *  - Arrow-key navigation, Enter/Space to select, Escape to close
 *  - Typeahead: typing a character jumps to the first matching option
 *
 * @module accessibility/AccessibleDropdown
 * @task US_043 TASK_004
 */

import React, { useState, useRef, useCallback, useId, useEffect } from 'react';
import './AccessibleDropdown.css';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AccessibleDropdownProps {
  /** Visible label text */
  label: string;
  /** Available options */
  options: DropdownOption[];
  /** Currently selected value */
  value: string;
  /** Called when selection changes */
  onChange: (value: string) => void;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Disable the dropdown entirely */
  disabled?: boolean;
}

export const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select\u2026',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownId = useId();
  const listboxId = `${dropdownId}-listbox`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const wrapper = buttonRef.current?.parentElement;
      if (wrapper && !wrapper.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Scroll focused option into view
  useEffect(() => {
    if (!isOpen || focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>('[role="option"]');
    items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, isOpen]);

  const open = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    const idx = options.findIndex((o) => o.value === value);
    setFocusedIndex(idx >= 0 ? idx : 0);
  }, [disabled, options, value]);

  const close = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  }, []);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      close();
    },
    [onChange, close],
  );

  // Typeahead: match first letter(s)
  const handleTypeahead = useCallback(
    (char: string) => {
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
      typeaheadRef.current += char.toLowerCase();

      const match = options.findIndex(
        (o) => !o.disabled && o.label.toLowerCase().startsWith(typeaheadRef.current),
      );
      if (match >= 0) setFocusedIndex(match);

      typeaheadTimerRef.current = setTimeout(() => {
        typeaheadRef.current = '';
      }, 500);
    },
    [options],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
          open();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) next++;
            return next < options.length ? next : prev;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) next--;
            return next >= 0 ? next : prev;
          });
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && !options[focusedIndex]?.disabled) {
            select(options[focusedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            handleTypeahead(e.key);
          }
          break;
      }
    },
    [isOpen, open, close, select, focusedIndex, options, handleTypeahead],
  );

  return (
    <div className="a11y-dropdown">
      <label id={dropdownId} className="a11y-dropdown__label">
        {label}
      </label>

      <button
        ref={buttonRef}
        type="button"
        className="a11y-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={dropdownId}
        aria-activedescendant={
          isOpen && focusedIndex >= 0
            ? `${listboxId}-option-${focusedIndex}`
            : undefined
        }
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <span className="a11y-dropdown__arrow" aria-hidden="true">
          {isOpen ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={dropdownId}
          className="a11y-dropdown__listbox"
          tabIndex={-1}
        >
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              id={`${listboxId}-option-${idx}`}
              role="option"
              aria-selected={value === opt.value}
              aria-disabled={opt.disabled || undefined}
              className={[
                'a11y-dropdown__option',
                idx === focusedIndex ? 'a11y-dropdown__option--focused' : '',
                value === opt.value ? 'a11y-dropdown__option--selected' : '',
                opt.disabled ? 'a11y-dropdown__option--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (!opt.disabled) select(opt.value);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AccessibleDropdown;
