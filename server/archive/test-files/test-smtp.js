// Test script to send email directly to local SMTP server
import nodemailer from 'nodemailer';

async function testSMTP() {
  // Create a transporter for the local SMTP server
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525,
    secure: false, // true for 465, false for other ports
    auth: false, // No authentication for local testing
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP server connection verified');

    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: '"Test Sender" <test@example.com>',
      to: 'turnernelson1-659959@inbound.homeops.ai',
      subject: 'Test Email - Comprehensive AI Analysis',
      text: 'This is a test email sent to turnernelson1-659959@inbound.homeops.ai to test the new comprehensive AI analysis pipeline. This email should trigger vector embeddings, theme analysis, agent memory extraction, and profile suggestions.',
      html: '<p>This is a test email sent to <strong>turnernelson1-659959@inbound.homeops.ai</strong> to test the new comprehensive AI analysis pipeline.</p><p>This email should trigger:</p><ul><li>Vector embeddings generation</li><li>Theme analysis</li><li>Agent memory extraction</li><li>Profile suggestions</li></ul>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);

  } catch (error) {
    console.error('❌ SMTP test failed:', error);
  }
}

testSMTP();