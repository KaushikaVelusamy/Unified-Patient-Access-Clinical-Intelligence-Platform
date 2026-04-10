/**
 * AccessibleModal – reusable dialog wrapper
 *
 * Provides the WAI-ARIA Dialog (Modal) pattern out of the box:
 *  - role="dialog" + aria-modal="true"
 *  - aria-labelledby / aria-describedby
 *  - Focus trap (Tab / Shift-Tab) via useFocusTrap
 *  - Escape key closes
 *  - Click-outside (backdrop) closes
 *  - Body scroll lock while open
 *
 * @module accessibility/AccessibleModal
 * @task US_043 TASK_004
 */

import React, { useEffect, useId } from 'react';
import { useFocusTrap } from '../../utils/focus-management';
import './AccessibleModal.css';

export interface AccessibleModalProps {
  /** Whether the modal is currently visible */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Modal title rendered inside an <h2> and linked via aria-labelledby */
  title: string;
  /** Optional description text linked via aria-describedby */
  description?: string;
  /** Child content rendered inside the dialog body */
  children: React.ReactNode;
  /** Additional CSS class on the dialog element */
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="a11y-modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`a11y-modal ${className ?? ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="a11y-modal__header">
          <h2 id={titleId} className="a11y-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="a11y-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {description && (
          <p id={descId} className="a11y-modal__description">
            {description}
          </p>
        )}

        <div className="a11y-modal__body">{children}</div>
      </div>
    </div>
  );
};

export default AccessibleModal;
