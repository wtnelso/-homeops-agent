// Auth form validation library
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AuthValidator {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email) {
      errors.push('Email is required');
    } else {
      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
      }

      // Check length
      if (email.length > 254) {
        errors.push('Email address is too long');
      }

      // Check for suspicious characters
      const suspiciousChars = /[<>\"'&]/;
      if (suspiciousChars.test(email)) {
        errors.push('Email contains invalid characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
    } else {
      // Minimum length
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }

      // Maximum length (prevent DoS)
      if (password.length > 128) {
        errors.push('Password is too long (max 128 characters)');
      }

      // Must contain at least one uppercase letter
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      // Must contain at least one lowercase letter
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      // Must contain at least one number
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      // Must contain at least one special character
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }

      // Check for common weak passwords
      const commonPasswords = [
        'password', 'password123', '123456789', 'qwerty123',
        'admin123', 'welcome123', 'password1', 'letmein123'
      ];

      if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('This password is too common. Please choose a stronger password');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Password confirmation validation
  static validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
    const errors: string[] = [];

    if (!confirmPassword) {
      errors.push('Password confirmation is required');
    } else if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Rate limiting check (simple client-side)
  static checkRateLimit(identifier: string): ValidationResult {
    const errors: string[] = [];
    const storageKey = `auth_attempts_${identifier}`;
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const attempts = JSON.parse(stored);
        const now = Date.now();

        // Clean old attempts
        const recentAttempts = attempts.filter((time: number) => now - time < windowMs);

        if (recentAttempts.length >= maxAttempts) {
          errors.push('Too many login attempts. Please try again in 15 minutes.');
        } else {
          // Update storage with cleaned attempts
          localStorage.setItem(storageKey, JSON.stringify(recentAttempts));
        }
      }
    } catch (error) {
      // If localStorage fails, allow the attempt but log the error
      console.warn('Rate limiting storage error:', error);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Record failed attempt
  static recordFailedAttempt(identifier: string): void {
    const storageKey = `auth_attempts_${identifier}`;

    try {
      const stored = localStorage.getItem(storageKey);
      const attempts = stored ? JSON.parse(stored) : [];
      attempts.push(Date.now());
      localStorage.setItem(storageKey, JSON.stringify(attempts));
    } catch (error) {
      console.warn('Failed to record attempt:', error);
    }
  }

  // Clear attempts on successful login
  static clearAttempts(identifier: string): void {
    const storageKey = `auth_attempts_${identifier}`;
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear attempts:', error);
    }
  }

  // Sanitize input (prevent XSS)
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

// Real-time validation hook
export const useFieldValidation = (
  value: string,
  validator: (value: string) => ValidationResult,
  debounceMs: number = 500
) => {
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!value) {
      setValidation({ isValid: true, errors: [] });
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(() => {
      const result = validator(value);
      setValidation(result);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, validator, debounceMs]);

  return { validation, isValidating };
};

// Import React hooks
import { useState, useEffect } from 'react';