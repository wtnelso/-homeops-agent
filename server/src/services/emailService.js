/**
 * Email Service using SendGrid
 * Reusable service for sending emails throughout the application
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send email using SendGrid
 * @param {Object} emailOptions - Email configuration
 * @param {string} emailOptions.to - Recipient email address
 * @param {string} emailOptions.from - Sender email address (optional, uses default)
 * @param {string} emailOptions.subject - Email subject
 * @param {string} emailOptions.text - Plain text content
 * @param {string} emailOptions.html - HTML content (optional)
 */
export async function sendEmail({ to, from, subject, text, html }) {
  try {
    console.log(`📤 Sending email to: ${to}`);
    console.log(`📝 Subject: ${subject}`);

    const msg = {
      to,
      from: from || process.env.SENDGRID_FROM_EMAIL || 'noreply@homeops.ai',
      subject,
      text,
      html
    };

    const result = await sgMail.send(msg);

    console.log('✅ Email sent successfully');
    return {
      success: true,
      messageId: result[0].headers['x-message-id'],
      statusCode: result[0].statusCode
    };

  } catch (error) {
    console.error('❌ Failed to send email:', error);

    return {
      success: false,
      error: error.message,
      details: error.response?.body || null
    };
  }
}

/**
 * Send bulk emails using SendGrid
 * @param {Array} emails - Array of email objects
 */
export async function sendBulkEmails(emails) {
  try {
    console.log(`📤 Sending ${emails.length} bulk emails`);

    const messages = emails.map(email => ({
      to: email.to,
      from: email.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@homeops.ai',
      subject: email.subject,
      text: email.text,
      html: email.html
    }));

    const result = await sgMail.send(messages);

    console.log(`✅ ${emails.length} emails sent successfully`);
    return {
      success: true,
      count: emails.length,
      results: result
    };

  } catch (error) {
    console.error('❌ Failed to send bulk emails:', error);

    return {
      success: false,
      error: error.message,
      details: error.response?.body || null
    };
  }
}