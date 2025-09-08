import { CLOUDINARY_CONFIG, getCloudinaryUploadUrl, getCloudinaryUrl, validateCloudinaryConfig } from '../config/cloudinary';

// Cloudinary upload response interface
export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
  tags?: string[];
  folder?: string;
}

// Upload options interface
export interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
  publicId?: string;
  overwrite?: boolean;
  invalidate?: boolean;
}

// Upload progress callback
export type UploadProgressCallback = (progress: number) => void;

class CloudinaryService {
  private configured: boolean;

  constructor() {
    this.configured = validateCloudinaryConfig();
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {},
    onProgress?: UploadProgressCallback
  ): Promise<CloudinaryUploadResponse> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not properly configured. Please check your environment variables.');
    }

    // Validate file
    this.validateFile(file);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', options.folder || CLOUDINARY_CONFIG.folder);

    // Add optional parameters
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    if (options.transformation) {
      formData.append('transformation', options.transformation);
    }

    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }

    if (options.overwrite !== undefined) {
      formData.append('overwrite', options.overwrite.toString());
    }

    if (options.invalidate !== undefined) {
      formData.append('invalidate', options.invalidate.toString());
    }

    try {
      const response = await this.uploadWithProgress(formData, onProgress);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const result: CloudinaryUploadResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(error instanceof Error ? error.message : 'Upload failed');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {},
    onProgress?: UploadProgressCallback
  ): Promise<CloudinaryUploadResponse[]> {
    const uploadPromises = files.map((file, index) => {
      const fileOptions = {
        ...options,
        folder: options.folder ? `${options.folder}/${index + 1}` : `${CLOUDINARY_CONFIG.folder}/${index + 1}`,
      };
      return this.uploadFile(file, fileOptions);
    });

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Multiple file upload error:', error);
      throw new Error('One or more files failed to upload');
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not properly configured');
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            api_key: CLOUDINARY_CONFIG.apiKey,
            api_secret: CLOUDINARY_CONFIG.apiSecret,
          }),
        }
      );

      const result = await response.json();
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Get optimized image URL
   */
  getImageUrl(publicId: string, transformation?: string): string {
    return getCloudinaryUrl(publicId, transformation);
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(publicId: string): string {
    return getCloudinaryUrl(publicId, CLOUDINARY_CONFIG.imageTransformations.thumbnail);
  }

  /**
   * Get avatar URL
   */
  getAvatarUrl(publicId: string): string {
    return getCloudinaryUrl(publicId, CLOUDINARY_CONFIG.imageTransformations.avatar);
  }

  /**
   * Get medium size URL
   */
  getMediumUrl(publicId: string): string {
    return getCloudinaryUrl(publicId, CLOUDINARY_CONFIG.imageTransformations.medium);
  }

  /**
   * Get large size URL
   */
  getLargeUrl(publicId: string): string {
    return getCloudinaryUrl(publicId, CLOUDINARY_CONFIG.imageTransformations.large);
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > CLOUDINARY_CONFIG.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${CLOUDINARY_CONFIG.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !CLOUDINARY_CONFIG.allowedFormats.includes(fileExtension)) {
      throw new Error(`File format not supported. Allowed formats: ${CLOUDINARY_CONFIG.allowedFormats.join(', ')}`);
    }
  }

  /**
   * Upload with progress tracking
   */
  private async uploadWithProgress(
    formData: FormData,
    onProgress?: UploadProgressCallback
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.responseText, { status: xhr.status }));
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.open('POST', getCloudinaryUploadUrl());
      xhr.send(formData);
    });
  }

  /**
   * Check if Cloudinary is configured
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { configured: boolean; missing: string[] } {
    const missing: string[] = [];
    const { cloudName, apiKey, uploadPreset } = CLOUDINARY_CONFIG;

    if (!cloudName) missing.push('REACT_APP_CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('REACT_APP_CLOUDINARY_API_KEY');
    if (!uploadPreset) missing.push('REACT_APP_CLOUDINARY_UPLOAD_PRESET');

    return {
      configured: missing.length === 0,
      missing,
    };
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
