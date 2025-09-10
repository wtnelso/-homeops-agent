/**
 * Comprehensive file validation service for secure image uploads
 * Prevents malicious file uploads through multiple validation layers
 */

// Allowed image file types with their MIME types and file signatures
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': {
    extensions: ['jpg', 'jpeg'],
    signatures: [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0xFF, 0xD8, 0xFF, 0xE0], // JPEG/JFIF
      [0xFF, 0xD8, 0xFF, 0xE1], // JPEG/EXIF
    ]
  },
  'image/png': {
    extensions: ['png'],
    signatures: [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
    ]
  },
  'image/webp': {
    extensions: ['webp'],
    signatures: [
      [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] // WEBP (null = any byte)
    ]
  },
  'image/gif': {
    extensions: ['gif'],
    signatures: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ]
  }
} as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

export class FileValidationService {
  /**
   * Maximum allowed file size (1MB - appropriate for avatar images)
   */
  private static readonly MAX_FILE_SIZE = 1 * 1024 * 1024;

  /**
   * Validates file for secure image upload
   * Performs multiple layers of validation:
   * 1. File size check
   * 2. MIME type validation
   * 3. File extension validation  
   * 4. File signature (magic bytes) verification
   * 5. Content validation attempt
   */
  static async validateImageFile(file: File): Promise<FileValidationResult> {
    try {
      // 1. File size validation
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size of 5MB`
        };
      }

      if (file.size === 0) {
        return {
          valid: false,
          error: 'File is empty'
        };
      }

      // 2. MIME type validation
      const mimeValidation = this.validateMimeType(file.type);
      if (!mimeValidation.valid) {
        return mimeValidation;
      }

      // 3. File extension validation
      const extensionValidation = this.validateFileExtension(file.name, file.type);
      if (!extensionValidation.valid) {
        return extensionValidation;
      }

      // 4. File signature validation (magic bytes)
      const signatureValidation = await this.validateFileSignature(file);
      if (!signatureValidation.valid) {
        return signatureValidation;
      }

      // 5. Content validation (attempt to load as image)
      const contentValidation = await this.validateImageContent(file);
      if (!contentValidation.valid) {
        return contentValidation;
      }

      return {
        valid: true,
        detectedType: file.type
      };

    } catch (error) {
      console.error('File validation error:', error);
      return {
        valid: false,
        error: 'File validation failed due to unexpected error'
      };
    }
  }

  /**
   * Validates MIME type against allowed image types
   */
  private static validateMimeType(mimeType: string): FileValidationResult {
    if (!mimeType) {
      return {
        valid: false,
        error: 'File has no MIME type information'
      };
    }

    if (!Object.keys(ALLOWED_IMAGE_TYPES).includes(mimeType)) {
      return {
        valid: false,
        error: `File type "${mimeType}" is not allowed. Allowed types: JPEG, PNG, WebP, GIF`
      };
    }

    return { valid: true };
  }

  /**
   * Validates file extension matches MIME type
   */
  private static validateFileExtension(fileName: string, mimeType: string): FileValidationResult {
    const fileExtension = fileName.toLowerCase().split('.').pop();
    
    if (!fileExtension) {
      return {
        valid: false,
        error: 'File has no extension'
      };
    }

    const allowedExtensions = ALLOWED_IMAGE_TYPES[mimeType as keyof typeof ALLOWED_IMAGE_TYPES]?.extensions;
    
    if (!allowedExtensions || !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `File extension "${fileExtension}" does not match declared type "${mimeType}"`
      };
    }

    return { valid: true };
  }

  /**
   * Validates file signature (magic bytes) to detect actual file type
   * This prevents malicious files with fake extensions/MIME types
   */
  private static async validateFileSignature(file: File): Promise<FileValidationResult> {
    try {
      // Read first 16 bytes of file to check signature
      const buffer = await file.slice(0, 16).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      const declaredType = ALLOWED_IMAGE_TYPES[file.type as keyof typeof ALLOWED_IMAGE_TYPES];
      if (!declaredType) {
        return { valid: false, error: 'Invalid declared file type' };
      }

      // Check if any signature matches
      const signatureMatches = declaredType.signatures.some(signature => {
        return signature.every((expectedByte, index) => {
          if (expectedByte === null) return true; // null means any byte is allowed
          return bytes[index] === expectedByte;
        });
      });

      if (!signatureMatches) {
        return {
          valid: false,
          error: `File signature does not match declared type "${file.type}". This may be a malicious file.`
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: 'Failed to read file signature'
      };
    }
  }

  /**
   * Attempts to validate file content by loading it as an image
   * This provides an additional layer of validation
   */
  private static async validateImageContent(file: File): Promise<FileValidationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        
        // Additional checks on loaded image
        if (img.width === 0 || img.height === 0) {
          resolve({
            valid: false,
            error: 'Image has invalid dimensions'
          });
          return;
        }

        // Check for reasonable dimensions (not too large for avatars)
        if (img.width > 2000 || img.height > 2000) {
          resolve({
            valid: false,
            error: 'Image dimensions are too large (max 2000x2000 pixels for avatars)'
          });
          return;
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          valid: false,
          error: 'File is not a valid image or is corrupted'
        });
      };

      // Set timeout to prevent hanging on malicious files
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          valid: false,
          error: 'Image validation timeout - file may be corrupted'
        });
      }, 5000);

      img.src = objectUrl;
    });
  }

  /**
   * Get user-friendly error message for validation failures
   */
  static getValidationErrorMessage(result: FileValidationResult): string {
    if (result.valid) return '';
    
    // Provide user-friendly messages
    const error = result.error || 'Unknown validation error';
    
    if (error.includes('File size')) {
      return 'Please select an image smaller than 1MB.';
    }
    
    if (error.includes('not allowed') || error.includes('does not match')) {
      return 'Please select a valid image file (JPEG, PNG, WebP, or GIF).';
    }
    
    if (error.includes('signature') || error.includes('malicious')) {
      return 'This file appears to be invalid or potentially harmful. Please select a different image.';
    }
    
    if (error.includes('corrupted') || error.includes('not a valid image')) {
      return 'This image file appears to be corrupted. Please try a different image.';
    }
    
    if (error.includes('dimensions')) {
      return 'Image is too large. Please select an image smaller than 2000x2000 pixels.';
    }
    
    return 'Please select a valid image file.';
  }
}