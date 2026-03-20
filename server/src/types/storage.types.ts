/**
 * PDF Storage Type Definitions
 * 
 * TypeScript interfaces for PDF storage service operations including
 * filesystem storage, metadata tracking, secure download URLs, and cleanup.
 * 
 * @module storage.types
 * @created 2026-03-20
 * @task US_018 TASK_002
 */

/**
 * PDF metadata record from database
 */
export interface PDFMetadata {
  /** Unique identifier for the PDF metadata record */
  id: string;
  
  /** Appointment ID this PDF belongs to */
  appointmentId: string;
  
  /** Relative file path in storage (e.g., "2026-03/confirmation_abc123_1711098765432.pdf") */
  filePath: string;
  
  /** File size in bytes */
  fileSizeBytes: number;
  
  /** Timestamp when PDF was generated */
  generatedAt: Date;
  
  /** Timestamp when PDF should be deleted (generated_at + 30 days) */
  expiresAt: Date;
  
  /** User ID who triggered generation (nullable for system-generated) */
  createdBy?: string;
  
  /** Record creation timestamp */
  createdAt: Date;
  
  /** Record last update timestamp */
  updatedAt: Date;
}

/**
 * Options for PDF storage operations
 */
export interface PDFStorageOptions {
  /** Appointment ID (used in filename and metadata) */
  appointmentId: string;
  
  /** User ID who triggered the generation (optional) */
  createdBy?: string;
  
  /** Override default expiry duration in days (default: 30) */
  expiryDays?: number;
  
  /** Override base storage path (default: from env config) */
  basePath?: string;
}

/**
 * Result of PDF save operation
 */
export interface PDFSaveResult {
  /** Indicates if save operation was successful */
  success: boolean;
  
  /** PDF metadata record (if successful) */
  metadata?: PDFMetadata;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Relative file path in storage */
  filePath?: string;
  
  /** File size in bytes */
  fileSizeBytes?: number;
}

/**
 * Secure download URL with JWT token
 */
export interface SecureDownloadURL {
  /** Full download URL with token */
  url: string;
  
  /** JWT token (can be used separately for API calls) */
  token: string;
  
  /** Expiration timestamp for the URL */
  expiresAt: Date;
  
  /** Appointment ID encoded in the token */
  appointmentId: string;
}

/**
 * JWT payload for secure download tokens
 */
export interface DownloadTokenPayload {
  /** Appointment ID */
  appointmentId: string;
  
  /** Relative file path in storage */
  filePath: string;
  
  /** Token issued at timestamp (Unix epoch) */
  iat: number;
  
  /** Token expiration timestamp (Unix epoch) */
  exp: number;
}

/**
 * Result of token validation
 */
export interface TokenValidationResult {
  /** Indicates if token is valid */
  valid: boolean;
  
  /** Decoded token payload (if valid) */
  payload?: DownloadTokenPayload;
  
  /** Error message (if invalid) */
  error?: string;
  
  /** Absolute file path on filesystem (if valid and file exists) */
  absolutePath?: string;
}

/**
 * Result of PDF cleanup operation
 */
export interface CleanupResult {
  /** Indicates if cleanup was successful */
  success: boolean;
  
  /** Number of PDFs deleted from filesystem */
  filesDeleted: number;
  
  /** Number of metadata records deleted from database */
  recordsDeleted: number;
  
  /** Total bytes freed from storage */
  bytesFree: number;
  
  /** Cleanup execution time in milliseconds */
  executionTimeMs: number;
  
  /** Array of errors encountered during cleanup (if any) */
  errors?: string[];
  
  /** Timestamp when cleanup started */
  startedAt: Date;
  
  /** Timestamp when cleanup completed */
  completedAt: Date;
}

/**
 * PDF storage configuration from environment
 */
export interface StorageConfig {
  /** Base path for PDF storage (e.g., "/app/storage/pdfs") */
  basePath: string;
  
  /** Download URL expiry duration in days (default: 7) */
  downloadUrlExpiryDays: number;
  
  /** PDF retention duration in days (default: 30) */
  pdfRetentionDays: number;
  
  /** JWT secret for signing download tokens */
  jwtSecret: string;
  
  /** Base URL for download endpoints (e.g., "https://api.clinic.com") */
  baseUrl: string;
}

/**
 * Options for PDF metadata query
 */
export interface PDFMetadataQuery {
  /** Filter by appointment ID */
  appointmentId?: string;
  
  /** Filter by expiry date (find expired PDFs) */
  expiresBefor?: Date;
  
  /** Filter by generation date */
  generatedAfter?: Date;
  
  /** Limit number of results */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
}

/**
 * Statistics for PDF storage usage
 */
export interface StorageStatistics {
  /** Total number of PDFs in storage */
  totalPdfs: number;
  
  /** Total storage used in bytes */
  totalBytes: number;
  
  /** Number of PDFs expiring in next 7 days */
  expiringSoon: number;
  
  /** Number of expired PDFs (ready for cleanup) */
  expired: number;
  
  /** Average PDF size in bytes */
  averageSize: number;
  
  /** Oldest PDF generation date */
  oldestPdf?: Date;
  
  /** Most recent PDF generation date */
  newestPdf?: Date;
}
