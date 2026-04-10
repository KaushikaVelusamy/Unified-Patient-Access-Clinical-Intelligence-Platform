/**
 * SkipLink Component
 *
 * Visually-hidden link that becomes visible on Tab focus, allowing
 * keyboard users to bypass navigation and jump directly to the
 * main content area.
 *
 * Meets WCAG 2.4.1 Bypass Blocks (Level A).
 *
 * @module SkipLink
 * @task US_043 TASK_002
 */

import React from 'react';
import './SkipLink.css';

interface SkipLinkProps {
  /** ID of the target element to skip to */
  targetId: string;
  /** Link text (default: "Skip to main content") */
  children?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  children = 'Skip to main content',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a href={`#${targetId}`} className="skip-link" onClick={handleClick}>
      {children}
    </a>
  );
};

export default SkipLink;
