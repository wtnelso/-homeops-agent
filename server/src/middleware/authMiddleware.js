import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

// Keep supabaseAdmin for optional JWT (fallback)
const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Middleware to validate JWT tokens from Authorization header
 */
export const validateJWT = async (req, res, next) => {
  console.log('🔍 AUTH MIDDLEWARE: Starting validation');
  console.log('🔍 AUTH MIDDLEWARE: JWT Secret available:', !!supabaseJwtSecret);
  console.log('🔍 AUTH MIDDLEWARE: JWT Secret length:', supabaseJwtSecret?.length);
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔍 AUTH MIDDLEWARE: Auth header received:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header',
        message: 'Please provide a valid JWT token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate JWT locally
    const decoded = jwt.verify(token, supabaseJwtSecret, { algorithms: ['HS256'] });

    if (!decoded || !decoded.sub) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Please log in again'
      });
    }

    // Attach user info to request object
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      ...decoded
    };
    req.token = token;

    // Log successful authentication
    console.log(`✅ Authenticated request from user: ${decoded.email} (${decoded.sub})`);

    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication service error',
      message: 'Please try again'
    });
  }
};

/**
 * Optional JWT validation - doesn't fail if no token provided
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Try to validate token
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && user) {
        req.user = user;
        req.token = token;
        console.log(`✅ Optional auth successful for: ${user.email}`);
      } else {
        console.log('⚠️ Optional auth failed, continuing without user');
      }
    }

    next();

  } catch (error) {
    console.error('Optional authentication error:', error);
    // Continue without authentication
    next();
  }
};

/**
 * Check if user has admin privileges
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    // Check if user is admin (you can customize this logic)
    const isAdmin = req.user.user_metadata?.role === 'admin' ||
                   req.user.app_metadata?.role === 'admin' ||
                   process.env.ADMIN_EMAIL === req.user.email;

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'You do not have permission to access this resource'
      });
    }

    console.log(`🔐 Admin access granted to: ${req.user.email}`);
    next();

  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      error: 'Authorization service error',
      message: 'Please try again'
    });
  }
};

export default {
  validateJWT,
  optionalJWT,
  requireAdmin
};