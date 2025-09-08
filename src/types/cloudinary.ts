// Cloudinary Types
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
  version?: number;
  signature?: string;
  etag?: string;
  placeholder?: boolean;
  original_filename?: string;
  url?: string;
}

export interface CloudinaryError {
  error: {
    message: string;
    http_code: number;
  };
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
  publicId?: string;
  overwrite?: boolean;
  invalidate?: boolean;
  quality?: string | number;
  format?: string;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
}

export interface ImageTransformations {
  thumbnail: string;
  medium: string;
  large: string;
  avatar: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
  folder: string;
  maxFileSize: number;
  allowedFormats: string[];
  imageTransformations: ImageTransformations;
}
