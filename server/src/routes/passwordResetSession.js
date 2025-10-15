import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { validateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.PASSWORD_RESET_ENCRYPTION_KEY || 'default-key-change-in-production';

// Create admin client for server-side validation
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Encrypt session data
function encryptSessionData(data) {
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt session data
function decryptSessionData(encryptedData) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
}

// Create password reset session
router.post('/create', validateJWT, async (req, res) => {
  try {
    const { access_token, type } = req.body;

    if (type !== 'recovery') {
      return res.status(400).json({ error: 'Invalid session type' });
    }

    // Validate the access token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const sessionData = {
      userId: user.id,
      timestamp: Date.now(),
      type: 'password_reset'
    };

    const encryptedSession = encryptSessionData(sessionData);

    // Set secure, httpOnly cookie with 15-minute expiry
    res.cookie('prs', encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });

    res.json({
      success: true,
      isPasswordResetSession: true,
      sessionType: 'password_reset'
    });

  } catch (error) {
    console.error('Create password reset session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate password reset session
router.get('/validate', validateJWT, async (req, res) => {
  try {
    const encryptedSession = req.cookies.prs;

    if (!encryptedSession) {
      return res.json({
        isPasswordResetSession: false,
        sessionType: 'normal'
      });
    }

    const sessionData = decryptSessionData(encryptedSession);

    if (!sessionData) {
      // Invalid/corrupted session data
      res.clearCookie('prs');
      return res.json({
        isPasswordResetSession: false,
        sessionType: 'normal'
      });
    }

    // Check if session has expired (15 minutes)
    const sessionAge = Date.now() - sessionData.timestamp;
    const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds

    if (sessionAge > maxAge) {
      // Session expired
      res.clearCookie('prs');
      return res.json({
        isPasswordResetSession: false,
        sessionType: 'normal',
        expired: true
      });
    }

    res.json({
      isPasswordResetSession: true,
      sessionType: 'password_reset',
      userId: sessionData.userId,
      timeRemaining: maxAge - sessionAge
    });

  } catch (error) {
    console.error('Validate password reset session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear password reset session
router.post('/clear', validateJWT, async (req, res) => {
  try {
    res.clearCookie('prs');
    res.json({ success: true });
  } catch (error) {
    console.error('Clear password reset session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;