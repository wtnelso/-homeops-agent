/**
 * Vercel API Route: Inbound Email Webhook
 *
 * Receives emails via webhook from email service providers
 * and forwards to Render server for AI processing
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📧 Received inbound email webhook');
    console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 Body:', JSON.stringify(req.body, null, 2));

    // Extract email data (format depends on your email service)
    const emailData = {
      from: req.body.from || req.body.sender,
      to: req.body.to || req.body.recipient,
      subject: req.body.subject,
      text: req.body.text || req.body['body-plain'],
      html: req.body.html || req.body['body-html'],
      messageId: req.body.messageId || req.body['Message-Id'],
      date: req.body.date || new Date().toISOString()
    };

    console.log('📩 Processed email data:', emailData);

    // Validate required fields
    if (!emailData.from || !emailData.to || !emailData.subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required email fields: from, to, subject'
      });
    }

    // Forward to Render server for AI processing
    const renderServerUrl = process.env.VITE_RENDER_SERVER_URL || 'https://homeops-agent-p77u.onrender.com';

    console.log(`🚀 Forwarding to Render server: ${renderServerUrl}/inbound-email`);

    const response = await fetch(`${renderServerUrl}/inbound-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    console.log('📊 Render server response:', result);

    if (!response.ok) {
      console.error('❌ Render server error:', result);
      return res.status(500).json({
        success: false,
        error: 'Failed to process email on Render server',
        details: result
      });
    }

    console.log('✅ Email processed successfully via Vercel → Render pipeline');

    return res.status(200).json({
      success: true,
      message: 'Email processed successfully',
      ...result
    });

  } catch (error) {
    console.error('💥 Vercel inbound email error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}