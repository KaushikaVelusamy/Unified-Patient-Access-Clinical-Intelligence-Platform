/**
 * AccessibleTooltip Component
 *
 * Tooltip that appears on hover + focus and hides on Escape/blur.
 * Auto-dismisses after a configurable timeout (default 5 s).
 *
 * Implements WAI-ARIA Tooltip pattern:
 *  - role="tooltip" on the tooltip element
 *  - aria-describedby on the trigger linking to the tooltip id
 *  - Dismiss with Escape key
 *
 * @module accessibility/AccessibleTooltip
 * @task US_043 TASK_004
 */

import React, { useState, useRef, useCallback, useId, useEffect } from 'react';
import './AccessibleTooltip.css';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface AccessibleTooltipProps {
  /** Trigger element(s) that the tooltip describes */
  children: React.ReactNode;
  /** Tooltip text content */
  content: string;
  /** Preferred position relative to the trigger */
  position?: TooltipPosition;
  /** Auto-dismiss timeout in ms (default: 5000, 0 = no auto-dismiss) */
  timeout?: number;
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  children,
  content,
  position = 'top',
  timeout = 5000,
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimer();
    setVisible(true);
    if (timeout > 0) {
      timerRef.current = setTimeout(() => setVisible(false), timeout);
    }
  }, [timeout, clearTimer]);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        e.preventDefault();
        hide();
      }
    },
    [visible, hide],
  );

  // Pause auto-dismiss while hovered / focused
  const handleMouseEnter = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <span
      className="a11y-tooltip-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>
        {children}
      </span>

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`a11y-tooltip a11y-tooltip--${position}`}
          onMouseEnter={handleMouseEnter}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default AccessibleTooltip;
