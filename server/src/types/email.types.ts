/**
 * Email Service Type Definitions
 * 
 * TypeScript interfaces for email sending operations including
 * SMTP configuration, email composition, attachments, delivery status, and audit logging.
 * 
 * @module email.types
 * @created 2026-03-20
 * @task US_018 TASK_003
 */

/**
 * Email delivery status
 */
export enum EmailStatus {
  /** Email sent successfully */
  SENT = 'sent',
  /** Email sending failed after all retries */
  FAILED = 'failed',
  /** Email pending send (in queue) */
  PENDING = 'pending',
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  /** Filename for the attachment */
  filename: string;
  
  /** Content as Buffer */
  content: Buffer;
  
  /** MIME type (e.g., 'application/pdf') */
  contentType: string;
  
  /** Optional content-disposition (default: 'attachment') */
  disposition?: 'attachment' | 'inline';
}

/**
 * Email composition options
 */
export interface EmailOptions {
  /** Recipient email address */
  to: string;
  
  /** Email subject line */
  subject: string;
  
  /** Plain text email body */
  text: string;
  
  /** HTML email body (optional) */
  html?: string;
  
  /** Email attachments (optional) */
  attachments?: EmailAttachment[];
  
  /** Sender email address (optional, uses default from config) */
  from?: string;
  
  /** Reply-to address (optional) */
  replyTo?: string;
  
  /** CC addresses (optional) */
  cc?: string[];
  
  /** BCC addresses (optional) */
  bcc?: string[];
}

/**
 * Email sending result
 */
export interface EmailResult {
  /** Indicates if email was sent successfully */
  success: boolean;
  
  /** Message ID from SMTP server (if successful) */
  messageId?: string;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Number of retry attempts made */
  retryCount: number;
  
  /** Timestamp when email was sent */
  sentAt?: Date;
  
  /** Email log entry ID from database */
  logId?: string;
}

/**
 * Email log entry from database
 */
export interface EmailLogEntry {
  /** Unique identifier for the log entry */
  id: string;
  
  /** Appointment ID this email belongs to */
  appointmentId: string;
  
  /** Recipient email address */
  recipientEmail: string;
  
  /** Email subject line */
  subject: string;
  
  /** Timestamp when email was sent (null if failed) */
  sentAt?: Date;
  
  /** Delivery status */
  status: EmailStatus;
  
  /** Number of retry attempts */
  retryCount: number;
  
  /** Error message if failed */
  errorMessage?: string;
  
  /** Whether PDF attachment was included */
  hasAttachment: boolean;
  
  /** Record creation timestamp */
  createdAt: Date;
  
  /** Record update timestamp */
  updatedAt: Date;
}

/**
 * Appointment data for email template
 */
export interface AppointmentEmailData {
  /** Appointment ID */
  appointmentId: string;
  
  /** Patient name */
  patientName: string;
  
  /** Patient email address */
  patientEmail: string;
  
  /** Formatted appointment date (e.g., "Monday, March 20, 2026") */
  appointmentDate: string;
  
  /** Formatted appointment time (e.g., "10:30 AM - 11:00 AM") */
  appointmentTime: string;
  
  /** Appointment duration in minutes */
  duration: number;
  
  /** Appointment type (consultation, follow-up, procedure) */
  type: string;
  
  /** Provider name */
  providerName: string;
  
  /** Provider credentials (optional) */
  providerCredentials?: string;
  
  /** Department name */
  departmentName: string;
  
  /** Location description */
  location: string;
  
  /** Full address */
  address: string;
  
  /** Preparation instructions (optional) */
  preparationInstructions?: string[];
  
  /** Clinic name */
  clinicName: string;
  
  /** Clinic phone */
  clinicPhone: string;
  
  /** Clinic email */
  clinicEmail: string;
  
  /** Clinic website (optional) */
  clinicWebsite?: string;
  
  /** Secure download URL for PDF (optional) */
  pdfDownloadUrl?: string;
}

/**
 * Email template rendering result
 */
export interface EmailTemplateResult {
  /** Rendered HTML content */
  html: string;
  
  /** Rendered plain text content */
  text: string;
  
  /** Email subject line */
  subject: string;
}

/**
 * SMTP configuration
 */
export interface SMTPConfig {
  /** SMTP server hostname */
  host: string;
  
  /** SMTP server port */
  port: number;
  
  /** Use secure connection (TLS) */
  secure: boolean;
  
  /** SMTP authentication */
  auth: {
    /** SMTP username */
    user: string;
    
    /** SMTP password */
    pass: string;
  };
  
  /** Sender email address */
  from: string;
  
  /** Email service name (for logging) */
  service?: string;
}

/**
 * Email retry configuration
 */
export interface EmailRetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Initial retry delay in milliseconds */
  initialDelay: number;
  
  /** Retry delay multiplier for exponential backoff */
  multiplier: number;
  
  /** Maximum retry delay in milliseconds */
  maxDelay: number;
}

/**
 * Options for sending appointment confirmation email
 */
export interface SendAppointmentConfirmationOptions {
  /** Appointment data for email template */
  appointmentData: AppointmentEmailData;
  
  /** PDF buffer to attach (optional - omit for text-only fallback) */
  pdfBuffer?: Buffer;
  
  /** PDF filename (optional - auto-generated if not provided) */
  pdfFilename?: string;
  
  /** Force text-only email (no PDF attachment) */
  textOnly?: boolean;
  
  /** Enable retry logic (default: true) */
  enableRetry?: boolean;
}

/**
 * Email statistics for monitoring
 */
export interface EmailStatistics {
  /** Total emails sent */
  totalSent: number;
  
  /** Total emails failed */
  totalFailed: number;
  
  /** Total emails pending */
  totalPending: number;
  
  /** Success rate (percentage) */
  successRate: number;
  
  /** Average retry count */
  averageRetries: number;
  
  /** Emails sent in last 24 hours */
  sentLast24Hours: number;
  
  /** Emails with attachments */
  withAttachments: number;
  
  /** Most recent email timestamp */
  mostRecentEmail?: Date;
}
