import { useState, useCallback } from 'react';
import { cloudinaryService, CloudinaryUploadResponse } from '../services/cloudinary';

interface UseCloudinaryReturn {
  uploadFile: (file: File, options?: any) => Promise<CloudinaryUploadResponse>;
  uploadMultipleFiles: (files: File[], options?: any) => Promise<CloudinaryUploadResponse[]>;
  deleteFile: (publicId: string) => Promise<boolean>;
  getImageUrl: (publicId: string, transformation?: string) => string;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  isConfigured: boolean;
  getConfigStatus: () => { configured: boolean; missing: string[] };
}

export const useCloudinary = (): UseCloudinaryReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, options = {}) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await cloudinaryService.uploadFile(
        file,
        options,
        (progress) => setUploadProgress(progress)
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (files: File[], options = {}) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const results = await cloudinaryService.uploadMultipleFiles(
        files,
        options,
        (progress) => setUploadProgress(progress)
      );
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const deleteFile = useCallback(async (publicId: string) => {
    try {
      const result = await cloudinaryService.deleteFile(publicId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  const getImageUrl = useCallback((publicId: string, transformation?: string) => {
    return cloudinaryService.getImageUrl(publicId, transformation);
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getImageUrl,
    isUploading,
    uploadProgress,
    error,
    isConfigured: cloudinaryService.isConfigured(),
    getConfigStatus: () => cloudinaryService.getConfigStatus(),
  };
};
