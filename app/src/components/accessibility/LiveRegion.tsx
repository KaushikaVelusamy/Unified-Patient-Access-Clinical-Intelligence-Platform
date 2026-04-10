/**
 * LiveRegion Component
 *
 * ARIA live-region wrapper for screen-reader announcements.
 *
 *  - `polite`    → non-critical updates (appointment booked, form saved)
 *  - `assertive` → critical errors (login failed, payment declined)
 *
 * The element is visually hidden (sr-only) but announced by assistive
 * technology whenever its content changes.
 *
 * @module LiveRegion
 * @task US_043 TASK_002
 */

import React, { type ReactNode } from 'react';

interface LiveRegionProps {
  /** Announcement text */
  message: string;
  /** `polite` for status updates, `assertive` for critical errors */
  type?: 'polite' | 'assertive';
  /** Optional child content */
  children?: ReactNode;
}

const srOnlyStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  type = 'polite',
  children,
}) => (
  <div
    role={type === 'assertive' ? 'alert' : 'status'}
    aria-live={type}
    aria-atomic="true"
    style={srOnlyStyle}
  >
    {message}
    {children}
  </div>
);

export default LiveRegion;
