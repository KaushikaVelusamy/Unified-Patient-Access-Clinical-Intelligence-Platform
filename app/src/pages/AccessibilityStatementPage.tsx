/**
 * Accessibility Statement Page
 *
 * Renders the WCAG 2.2 AA compliance statement with proper
 * semantic HTML structure (h1, h2, sections with aria-labelledby).
 *
 * @module pages/AccessibilityStatementPage
 * @task US_043 TASK_006
 */

import React from 'react';
import './AccessibilityStatementPage.css';

export const AccessibilityStatementPage: React.FC = () => {
  return (
    <div className="a11y-statement">
      <h1>Accessibility Statement</h1>
      <p className="a11y-statement__updated">
        Last updated: April 9, 2026 &mdash; Standard: WCAG 2.2 Level AA
      </p>

      <section aria-labelledby="a11y-commitment">
        <h2 id="a11y-commitment">Commitment</h2>
        <p>
          The Unified Patient Access &amp; Clinical Intelligence Platform is
          committed to ensuring digital accessibility for people with
          disabilities. We continually improve the user experience for everyone
          and apply the relevant accessibility standards.
        </p>
      </section>

      <section aria-labelledby="a11y-conformance">
        <h2 id="a11y-conformance">Conformance Status</h2>
        <p>
          <strong>
            This platform is fully conformant with WCAG 2.2 Level AA.
          </strong>{' '}
          &ldquo;Fully conformant&rdquo; means that the content fully conforms
          to the accessibility standard without any exceptions.
        </p>
      </section>

      <section aria-labelledby="a11y-tech">
        <h2 id="a11y-tech">Technical Specifications</h2>
        <ul>
          <li>HTML5</li>
          <li>CSS3</li>
          <li>JavaScript (React 18.x)</li>
          <li>WAI-ARIA 1.2</li>
        </ul>
      </section>

      <section aria-labelledby="a11y-scope">
        <h2 id="a11y-scope">Conformance Scope</h2>
        <ul>
          <li>
            <strong>Patient Portal:</strong> Login, Dashboard, Appointment
            Booking, Intake, Document Upload
          </li>
          <li>
            <strong>Staff Portal:</strong> Login, Dashboard, Queue Management,
            Clinical Review
          </li>
          <li>
            <strong>Admin Portal:</strong> Login, Dashboard, User Management,
            Audit Logs
          </li>
        </ul>
      </section>

      <section aria-labelledby="a11y-features">
        <h2 id="a11y-features">Accessibility Features</h2>

        <h3>Keyboard Navigation</h3>
        <ul>
          <li>All interactive elements operable via keyboard</li>
          <li>Visible 2px blue focus indicators on every focusable element</li>
          <li>Skip-to-main-content link on every page</li>
          <li>
            Role-scoped keyboard shortcuts (Alt+key) with legend (Alt+/)
          </li>
          <li>Focus trapped in modals; returns to trigger on close</li>
        </ul>

        <h3>Screen Reader Support</h3>
        <ul>
          <li>Semantic HTML (nav, main, section, headings)</li>
          <li>ARIA labels on all icon buttons and widgets</li>
          <li>ARIA live regions for notifications and queue updates</li>
          <li>Form inputs linked to labels and error descriptions</li>
        </ul>

        <h3>Visual Accessibility</h3>
        <ul>
          <li>Color contrast &ge; 4.5:1 (normal text), &ge; 3:1 (large text)</li>
          <li>Reduced motion via <code>prefers-reduced-motion</code></li>
          <li>High contrast mode via <code>prefers-contrast: high</code></li>
          <li>Text resizable to 200% without loss of functionality</li>
        </ul>
      </section>

      <section aria-labelledby="a11y-testing">
        <h2 id="a11y-testing">Testing Methods</h2>
        <ul>
          <li>Automated: axe-core with Vitest and Playwright</li>
          <li>Manual: NVDA, JAWS, VoiceOver screen readers</li>
          <li>Keyboard: Full navigation without mouse</li>
          <li>Color: WebAIM Contrast Checker</li>
        </ul>
      </section>

      <section aria-labelledby="a11y-known">
        <h2 id="a11y-known">Known Issues</h2>
        <p>
          All issues from our Q1 2026 audit have been remediated. No known
          accessibility issues exist at the time of this publication.
        </p>
      </section>

      <section aria-labelledby="a11y-feedback">
        <h2 id="a11y-feedback">Feedback</h2>
        <p>
          We welcome your feedback on accessibility. Please contact us:
        </p>
        <ul>
          <li>
            Email:{' '}
            <a href="mailto:accessibility@unifiedpatientaccess.com">
              accessibility@unifiedpatientaccess.com
            </a>
          </li>
          <li>
            Phone: <a href="tel:+18006227377">1-800-ACCESS-1</a>
          </li>
        </ul>
        <p>We aim to respond within 2 business days.</p>
      </section>
    </div>
  );
};

export default AccessibilityStatementPage;
