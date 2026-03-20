/**
 * Plain Text Email Template for Appointment Confirmation
 * 
 * Generates plain text email content for appointment confirmations.
 * Used as fallback when HTML is not supported or when PDF generation fails.
 * 
 * @module appointmentConfirmation.text
 * @created 2026-03-20
 * @task US_018 TASK_003
 */

import type { AppointmentEmailData } from '../../types/email.types';

/**
 * Generate plain text email content for appointment confirmation
 * 
 * @param data Appointment email data
 * @returns Plain text email body
 * 
 * @example
 * const text = generateAppointmentConfirmationText({
 *   patientName: 'John Doe',
 *   appointmentDate: 'Monday, March 20, 2026',
 *   appointmentTime: '10:30 AM - 11:00 AM',
 *   ...
 * });
 */
export function generateAppointmentConfirmationText(
  data: AppointmentEmailData
): string {
  const {
    patientName,
    appointmentId,
    appointmentDate,
    appointmentTime,
    duration,
    type,
    providerName,
    providerCredentials,
    departmentName,
    location,
    address,
    preparationInstructions,
    clinicName,
    clinicPhone,
    clinicEmail,
    clinicWebsite,
    pdfDownloadUrl,
  } = data;

  // Build email text
  let text = '';

  // Header
  text += `${clinicName}\n`;
  text += `${'='.repeat(clinicName.length)}\n\n`;
  text += 'APPOINTMENT CONFIRMATION\n\n';

  // Greeting
  text += `Dear ${patientName},\n\n`;
  text += 'Your appointment has been confirmed. Please find the details below:\n\n';

  // Appointment Details
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  text += 'APPOINTMENT DETAILS\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  text += `📅 Date & Time:\n`;
  text += `   ${appointmentDate}\n`;
  text += `   ${appointmentTime}\n\n`;
  
  text += `🆔 Appointment ID: ${appointmentId}\n\n`;
  text += `📋 Type: ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;
  text += `⏱️  Duration: ${duration} minutes\n\n`;
  text += `👨‍⚕️ Provider: ${providerName}${providerCredentials ? `, ${providerCredentials}` : ''}\n\n`;
  text += `🏥 Department: ${departmentName}\n\n`;
  text += `📍 Location: ${location}\n\n`;
  text += `🗺️  Address:\n   ${address}\n\n`;

  // Preparation Instructions
  if (preparationInstructions && preparationInstructions.length > 0) {
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    text += 'PREPARATION INSTRUCTIONS\n';
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    text += 'Please follow these instructions before your appointment:\n\n';
    
    preparationInstructions.forEach((instruction, index) => {
      text += `${index + 1}. ${instruction}\n`;
    });
    
    text += '\n';
  }

  // PDF Download Link
  if (pdfDownloadUrl) {
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    text += 'PDF CONFIRMATION\n';
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    text += 'A PDF confirmation is attached to this email.\n';
    text += 'You can also download it from:\n\n';
    text += `${pdfDownloadUrl}\n\n`;
    text += '(This link is valid for 7 days)\n\n';
  }

  // Important Notes
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  text += 'IMPORTANT NOTES\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  text += '• Please arrive 15 minutes before your appointment\n';
  text += '• Bring a valid photo ID and your insurance card\n';
  text += '• If you need to cancel or reschedule, please provide\n';
  text += '  at least 24 hours notice\n\n';

  // Contact Information
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  text += 'CONTACT INFORMATION\n';
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  text += 'If you have any questions or need to make changes to\n';
  text += 'your appointment, please contact us:\n\n';
  text += `📞 Phone: ${clinicPhone}\n`;
  text += `✉️  Email: ${clinicEmail}\n`;
  
  if (clinicWebsite) {
    text += `🌐 Website: ${clinicWebsite}\n`;
  }
  
  text += '\n';

  // Closing
  text += 'We look forward to seeing you!\n\n';
  text += `Best regards,\n`;
  text += `${clinicName}\n\n`;

  // Footer
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  text += 'This is an automated message. Please do not reply to this email.\n\n';
  text += '⚠️  PROTECTED HEALTH INFORMATION\n';
  text += 'Handle Securely per HIPAA\n\n';

  return text;
}

/**
 * Generate email subject line for appointment confirmation
 * 
 * @param data Appointment email data
 * @returns Email subject line
 * 
 * @example
 * const subject = generateAppointmentConfirmationSubject({
 *   clinicName: 'ABC Clinic',
 *   appointmentDate: 'Monday, March 20, 2026',
 *   ...
 * });
 * // Returns: "Appointment Confirmation - ABC Clinic - Monday, March 20, 2026"
 */
export function generateAppointmentConfirmationSubject(
  data: AppointmentEmailData
): string {
  return `Appointment Confirmation - ${data.clinicName} - ${data.appointmentDate}`;
}

/**
 * Generate text-only fallback email when PDF generation fails
 * 
 * @param data Appointment email data
 * @returns Plain text email body with notice about PDF failure
 * 
 * @example
 * const text = generateTextOnlyFallback({
 *   patientName: 'John Doe',
 *   ...
 * });
 */
export function generateTextOnlyFallback(
  data: AppointmentEmailData
): string {
  let text = generateAppointmentConfirmationText(data);
  
  // Add notice about PDF failure
  const notice = '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  const noticeText = 'NOTICE: PDF GENERATION UNAVAILABLE\n';
  const noticeBody = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  const noticeMessage = 'We were unable to generate a PDF confirmation at this time.\n';
  const noticeMessage2 = 'All your appointment details are included in this email.\n';
  const noticeMessage3 = 'You can request a PDF copy by contacting us.\n\n';
  
  // Insert notice before contact information section
  const contactIndex = text.indexOf('CONTACT INFORMATION');
  if (contactIndex > -1) {
    const beforeContact = text.substring(0, contactIndex - 50); // Back up before the separator
    const afterContact = text.substring(contactIndex - 50);
    
    text = beforeContact + notice + noticeText + noticeBody + noticeMessage + 
           noticeMessage2 + noticeMessage3 + afterContact;
  }
  
  return text;
}
