import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cloudinaryService, CloudinaryUploadResponse } from '../services/cloudinary';
import './ImageUpload.css';

interface ImageUploadProps {
  onUpload: (response: CloudinaryUploadResponse) => void;
  onError?: (error: string) => void;
  onRemove?: () => void;
  existingImage?: string;
  folder?: string;
  tags?: string[];
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  placeholder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  onError,
  onRemove,
  existingImage,
  folder = 'bestie-admin',
  tags = [],
  maxFiles = 1,
  acceptedTypes = ['image/*'],
  className = '',
  disabled = false,
  showPreview = true,
  placeholder = 'Click to upload or drag and drop'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<CloudinaryUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    if (fileArray.length > maxFiles) {
      const errorMsg = `Maximum ${maxFiles} file(s) allowed`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      for (const file of fileArray) {
        const response = await cloudinaryService.uploadFile(
          file,
          { folder, tags },
          (progress) => setUploadProgress(progress)
        );
        
        setUploadedImage(response);
        onUpload(response);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [folder, tags, maxFiles, onUpload, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleRemove = useCallback(() => {
    setUploadedImage(null);
    setError(null);
    onRemove?.();
  }, [onRemove]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon size={24} />;
    }
    return <FileText size={24} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const displayImage = uploadedImage?.secure_url || existingImage;

  return (
    <div className={`image-upload-container ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {!displayImage ? (
        <div
          className={`upload-area ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="upload-content">
            <Upload size={48} className="upload-icon" />
            <h3 className="upload-title">Upload {maxFiles > 1 ? 'Files' : 'File'}</h3>
            <p className="upload-description">{placeholder}</p>
            <div className="upload-formats">
              <span>Supported: JPG, PNG, GIF, WebP, SVG, PDF</span>
            </div>
          </div>

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="progress-text">{Math.round(uploadProgress)}%</span>
            </div>
          )}
        </div>
      ) : (
        <div className="uploaded-file">
          <div className="file-preview">
            {showPreview && uploadedImage?.resource_type === 'image' ? (
              <img 
                src={displayImage} 
                alt="Uploaded" 
                className="preview-image"
              />
            ) : (
              <div className="file-icon">
                {getFileIcon(uploadedImage?.format || '')}
              </div>
            )}
          </div>
          
          <div className="file-info">
            <div className="file-name">
              {uploadedImage?.public_id?.split('/').pop() || 'Uploaded file'}
            </div>
            {uploadedImage && (
              <div className="file-details">
                <span className="file-size">{formatFileSize(uploadedImage.bytes)}</span>
                <span className="file-format">{uploadedImage.format?.toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="file-actions">
            <button
              type="button"
              className="action-button remove"
              onClick={handleRemove}
              disabled={disabled}
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {uploadedImage && !error && (
        <div className="success-message">
          <CheckCircle size={16} />
          <span>File uploaded successfully</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

