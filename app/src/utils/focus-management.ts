/**
 * Focus Management Utilities
 *
 * Provides hooks and helpers for accessible focus handling:
 *  - useFocusTrap: traps Tab/Shift-Tab within a container (modals)
 *  - useFocusVisible: adds `keyboard-navigation` class to <body> for
 *    keyboard-only focus indicators
 *  - getFocusableElements: queries all tabbable elements in a container
 *
 * @module focus-management
 * @task US_043 TASK_002
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Return all focusable elements inside a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Trap keyboard focus within a container while `isOpen` is true.
 *
 * - Focuses the first focusable element on open.
 * - Wraps Tab / Shift-Tab at boundaries.
 * - Restores focus to the previously-focused element on close.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isOpen: boolean) {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Remember the element that had focus before the trap opened
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = getFocusableElements(container);
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that triggered the trap
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  return containerRef;
}

/**
 * Detect keyboard vs mouse navigation and toggle a CSS class on `<body>`.
 *
 * When the user presses Tab the class `keyboard-navigation` is added,
 * enabling visible focus rings. On mouse-down it is removed so that
 * click-focused elements don't show the ring.
 */
export function useFocusVisible(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
}
