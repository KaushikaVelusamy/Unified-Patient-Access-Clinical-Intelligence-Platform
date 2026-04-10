/**
 * KeyboardShortcuts Component
 *
 * Registers global Alt-key shortcuts for quick navigation and renders
 * an accessible legend modal triggered by Alt+/.
 *
 * Shortcuts are scoped by the current user's role so only relevant
 * actions are available.
 *
 * @module KeyboardShortcuts
 * @task US_043 TASK_002
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFocusTrap } from '../../utils/focus-management';
import './KeyboardShortcuts.css';

export const KeyboardShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLegend, setShowLegend] = useState(false);
  const modalRef = useFocusTrap<HTMLDivElement>(showLegend);

  const closeLegend = useCallback(() => setShowLegend(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Alt+/ — toggle shortcuts legend
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        setShowLegend((prev) => !prev);
        return;
      }

      // Escape — close legend
      if (e.key === 'Escape' && showLegend) {
        e.preventDefault();
        closeLegend();
        return;
      }

      if (!e.altKey || !user) return;

      const role = user.role;

      switch (e.key.toLowerCase()) {
        case 'b':
          if (role === 'patient') {
            e.preventDefault();
            navigate('/appointments/book');
          }
          break;
        case 'i':
          if (role === 'patient' || role === 'staff' || role === 'doctor') {
            e.preventDefault();
            navigate('/intake/ai');
          }
          break;
        case 'u':
          if (role === 'admin') {
            e.preventDefault();
            navigate('/admin/users');
          }
          break;
        case 'd':
          e.preventDefault();
          if (role === 'patient') navigate('/patient/dashboard');
          else if (role === 'staff') navigate('/staff/dashboard');
          else if (role === 'doctor') navigate('/doctor/dashboard');
          else if (role === 'admin') navigate('/admin/dashboard');
          break;
        case 'q':
          if (role === 'staff' || role === 'admin') {
            e.preventDefault();
            navigate('/staff/queue');
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, navigate, showLegend, closeLegend]);

  if (!showLegend) return null;

  return (
    <div className="keyboard-shortcuts-overlay" onClick={closeLegend}>
      <div
        ref={modalRef}
        className="keyboard-shortcuts-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-header">
          <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          <button
            type="button"
            className="shortcuts-close"
            onClick={closeLegend}
            aria-label="Close shortcuts legend"
          >
            &times;
          </button>
        </div>

        <div className="shortcuts-body">
          {user?.role === 'patient' && (
            <section>
              <h3>Patient</h3>
              <ul>
                <li><kbd>Alt</kbd> + <kbd>B</kbd> &mdash; Book Appointment</li>
                <li><kbd>Alt</kbd> + <kbd>I</kbd> &mdash; Patient Intake</li>
                <li><kbd>Alt</kbd> + <kbd>D</kbd> &mdash; Dashboard</li>
              </ul>
            </section>
          )}

          {(user?.role === 'staff' || user?.role === 'doctor') && (
            <section>
              <h3>Staff / Doctor</h3>
              <ul>
                <li><kbd>Alt</kbd> + <kbd>D</kbd> &mdash; Dashboard</li>
                <li><kbd>Alt</kbd> + <kbd>Q</kbd> &mdash; Queue Management</li>
                <li><kbd>Alt</kbd> + <kbd>I</kbd> &mdash; Patient Intake</li>
              </ul>
            </section>
          )}

          {user?.role === 'admin' && (
            <section>
              <h3>Admin</h3>
              <ul>
                <li><kbd>Alt</kbd> + <kbd>D</kbd> &mdash; Dashboard</li>
                <li><kbd>Alt</kbd> + <kbd>U</kbd> &mdash; User Management</li>
                <li><kbd>Alt</kbd> + <kbd>Q</kbd> &mdash; Queue Management</li>
              </ul>
            </section>
          )}

          <section>
            <h3>Global</h3>
            <ul>
              <li><kbd>Alt</kbd> + <kbd>/</kbd> &mdash; Show this legend</li>
              <li><kbd>Esc</kbd> &mdash; Close modal / legend</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
