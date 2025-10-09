/**
 * Input Sanitization Service
 *
 * Protects against prompt injection attacks and prevents extraction
 * of sensitive information through malicious user inputs.
 */

export class InputSanitizer {
  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize security patterns for detection
   */
  initializePatterns() {
    // Prompt injection patterns
    this.injectionPatterns = [
      // Direct instruction override attempts
      /\b(ignore|disregard|forget|override)\s+(previous|above|earlier|system|instruction|prompt|rule)/i,
      /\b(new\s+instruction|new\s+prompt|updated\s+instruction)/i,

      // Role manipulation attempts
      /\b(you\s+are\s+now|act\s+as|pretend\s+to\s+be|roleplay\s+as)\b/i,
      /\b(become\s+a|transform\s+into|switch\s+to)\b/i,

      // System/admin impersonation
      /\[(system|admin|root|developer|owner)\]/i,
      /\b(system\s+message|admin\s+access|root\s+privileges)/i,

      // Context manipulation
      /\b(previous\s+conversation|conversation\s+history|context\s+was)/i,
      /\b(the\s+user\s+said|in\s+reality|actually\s+the)/i,

      // Direct data extraction attempts
      /\b(list\s+all|show\s+all|dump\s+all|export\s+all)/i,
      /\b(give\s+me\s+everything|all\s+data|complete\s+list)/i,

      // Technical exploitation attempts
      /\b(sql\s+injection|xss|javascript|<script)/i,
      /\b(eval|exec|system|shell|command)/i
    ];

    // Sensitive information patterns
    this.sensitivePatterns = [
      // Credentials and secrets
      /\b(password|secret|token|key|credential|auth|login)/i,
      /\b(api\s+key|access\s+token|private\s+key)/i,

      // Financial information requests
      /\b(credit\s+card|social\s+security|ssn|bank\s+account)/i,
      /\b(payment\s+info|billing|financial|salary)/i,

      // Bulk personal data requests
      /\b(all\s+contacts|everyone's|complete\s+address\s+book)/i,
      /\b(all\s+emails|entire\s+inbox|full\s+conversation)/i,

      // System information
      /\b(server|database|config|environment|internal)/i,
      /\b(debug|log|error|stack\s+trace)/i
    ];

    // Suspicious formatting patterns
    this.formatPatterns = [
      // Structured data extraction attempts
      /\b(json|xml|csv|table|format|structure)/i,
      /\b(markdown|html|code|raw\s+data)/i,

      // Bulk operations
      /\b(batch|bulk|mass|multiple|everything)/i,
      /\b(download|export|backup|archive)/i
    ];
  }

  /**
   * Main sanitization function
   * @param {string} message - User input message
   * @returns {Object} Sanitization result
   */
  sanitizeInput(message) {
    if (!message || typeof message !== 'string') {
      return {
        safe: false,
        sanitizedMessage: '',
        warnings: ['Invalid input format'],
        blocked: true
      };
    }

    const result = {
      safe: true,
      sanitizedMessage: message,
      warnings: [],
      blocked: false,
      riskLevel: 'low'
    };

    // Check for prompt injection attempts
    const injectionRisk = this.detectInjectionAttempts(message);
    if (injectionRisk.detected) {
      result.safe = false;
      result.warnings.push(...injectionRisk.warnings);
      result.riskLevel = 'high';
    }

    // Check for sensitive information requests
    const sensitiveRisk = this.detectSensitiveRequests(message);
    if (sensitiveRisk.detected) {
      result.warnings.push(...sensitiveRisk.warnings);
      result.riskLevel = sensitiveRisk.level;
    }

    // Check for suspicious formatting requests
    const formatRisk = this.detectSuspiciousFormatting(message);
    if (formatRisk.detected) {
      result.warnings.push(...formatRisk.warnings);
      if (result.riskLevel === 'low') {
        result.riskLevel = 'medium';
      }
    }

    // Apply sanitization based on risk level
    if (result.riskLevel === 'high') {
      result.blocked = true;
      result.safe = false;
    } else if (result.riskLevel === 'medium') {
      result.sanitizedMessage = this.applySanitization(message);
    }

    // Log security events
    if (!result.safe || result.warnings.length > 0) {
      this.logSecurityEvent(message, result);
    }

    return result;
  }

  /**
   * Detect prompt injection attempts
   */
  detectInjectionAttempts(message) {
    const detected = [];

    this.injectionPatterns.forEach((pattern, index) => {
      if (pattern.test(message)) {
        detected.push({
          pattern: pattern.source,
          type: 'injection',
          severity: 'high'
        });
      }
    });

    return {
      detected: detected.length > 0,
      warnings: detected.map(d => `Potential prompt injection detected: ${d.type}`),
      details: detected
    };
  }

  /**
   * Detect requests for sensitive information
   */
  detectSensitiveRequests(message) {
    const detected = [];

    this.sensitivePatterns.forEach((pattern, index) => {
      if (pattern.test(message)) {
        detected.push({
          pattern: pattern.source,
          type: 'sensitive',
          severity: 'medium'
        });
      }
    });

    // Determine risk level based on detection count and patterns
    let level = 'low';
    if (detected.length > 2) {
      level = 'high';
    } else if (detected.length > 0) {
      level = 'medium';
    }

    return {
      detected: detected.length > 0,
      level,
      warnings: detected.map(d => `Sensitive information request detected: ${d.type}`),
      details: detected
    };
  }

  /**
   * Detect suspicious formatting/extraction requests
   */
  detectSuspiciousFormatting(message) {
    const detected = [];

    this.formatPatterns.forEach((pattern, index) => {
      if (pattern.test(message)) {
        detected.push({
          pattern: pattern.source,
          type: 'format',
          severity: 'low'
        });
      }
    });

    return {
      detected: detected.length > 1, // Only flag if multiple format patterns
      warnings: detected.length > 1 ? ['Suspicious data formatting request detected'] : [],
      details: detected
    };
  }

  /**
   * Apply sanitization to reduce risk
   */
  applySanitization(message) {
    let sanitized = message;

    // Remove potentially dangerous instructions
    const dangerousInstructions = [
      /\b(ignore|disregard|forget)\s+[^\s]+/gi,
      /\b(you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+[^\s]+/gi,
      /\[(system|admin|root)\][^\]]*\]/gi
    ];

    dangerousInstructions.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Limit message length for safety
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000) + '... [TRUNCATED]';
    }

    return sanitized;
  }

  /**
   * Log security events for monitoring
   */
  logSecurityEvent(originalMessage, result) {
    const securityLog = {
      timestamp: new Date().toISOString(),
      riskLevel: result.riskLevel,
      blocked: result.blocked,
      warnings: result.warnings,
      messageLength: originalMessage.length,
      messagePreview: originalMessage.substring(0, 100) + '...',
      hash: this.hashMessage(originalMessage)
    };

    console.warn('🚨 Security Event:', securityLog);

    // In production, this should go to a security monitoring system
    // await securityMonitor.logEvent(securityLog);
  }

  /**
   * Create hash of message for logging without storing content
   */
  hashMessage(message) {
    // Simple hash for demonstration - use proper crypto in production
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Check if message should be blocked entirely
   */
  shouldBlockMessage(message) {
    const result = this.sanitizeInput(message);
    return result.blocked;
  }

  /**
   * Get safe version of message for processing
   */
  getSafeMessage(message) {
    const result = this.sanitizeInput(message);
    return result.blocked ? null : result.sanitizedMessage;
  }
}

// Create singleton instance
export const inputSanitizer = new InputSanitizer();

export default InputSanitizer;