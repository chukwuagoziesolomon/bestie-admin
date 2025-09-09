// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY || '',
  apiSecret: process.env.REACT_APP_CLOUDINARY_API_SECRET || '',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '',
  folder: process.env.REACT_APP_CLOUDINARY_FOLDER || 'bestie-admin',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx'],
  imageTransformations: {
    thumbnail: 'w_150,h_150,c_fill,q_auto,f_auto',
    medium: 'w_400,h_400,c_fill,q_auto,f_auto',
    large: 'w_800,h_800,c_fill,q_auto,f_auto',
    avatar: 'w_100,h_100,c_fill,q_auto,f_auto,r_max',
  }
};

// Validate Cloudinary configuration
export const validateCloudinaryConfig = (): boolean => {
  const { cloudName, apiKey, uploadPreset } = CLOUDINARY_CONFIG;
  
  if (!cloudName || !apiKey || !uploadPreset) {
    console.warn('Cloudinary configuration is incomplete. Please check your environment variables.');
    return false;
  }
  
  return true;
};

// Get Cloudinary upload URL
export const getCloudinaryUploadUrl = (): string => {
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
};

// Get Cloudinary asset URL
export const getCloudinaryUrl = (publicId: string, transformation?: string): string => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  
  if (transformation) {
    return `${baseUrl}/${transformation}/${publicId}`;
  }
  
  return `${baseUrl}/${publicId}`;
};

