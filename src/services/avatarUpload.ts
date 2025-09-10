import { supabase } from '../lib/supabase';
import { FileValidationService } from './fileValidation';

export class AvatarUploadService {
  /**
   * Uploads an avatar file to Supabase storage and returns the public URL
   */
  static async uploadAvatar(file: File, userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Comprehensive file validation
      console.log('Starting comprehensive file validation for:', file.name);
      const validationResult = await FileValidationService.validateImageFile(file);
      
      if (!validationResult.valid) {
        const userFriendlyError = FileValidationService.getValidationErrorMessage(validationResult);
        console.warn('File validation failed:', validationResult.error);
        return { success: false, error: userFriendlyError };
      }
      
      console.log('File validation passed for type:', validationResult.detectedType);

      // Create file name with timestamp to avoid conflicts
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${userId}_${timestamp}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Unexpected avatar upload error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Deletes an avatar file from Supabase storage
   */
  static async deleteAvatar(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'user-uploads');
      
      if (bucketIndex === -1) {
        return { success: false, error: 'Invalid avatar URL' };
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      // Delete file from storage
      const { error } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected avatar delete error:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Resizes an image file to the specified dimensions
   */
  static async resizeImage(file: File, maxWidth: number = 60, maxHeight: number = 60): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > height) {
          width = Math.min(maxWidth, width);
          height = width / aspectRatio;
        } else {
          height = Math.min(maxHeight, height);
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert back to file
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file); // Fallback to original file
          }
        }, file.type, 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}