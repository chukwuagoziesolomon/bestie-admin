import React, { useState } from 'react';
import { Cloud, Image as ImageIcon, FileText, Settings } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { useCloudinary } from '../hooks/useCloudinary';
import { CloudinaryUploadResponse } from '../services/cloudinary';
import './CloudinaryDemo.css';

const CloudinaryDemo: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<CloudinaryUploadResponse[]>([]);
  const [selectedImage, setSelectedImage] = useState<CloudinaryUploadResponse | null>(null);
  const { isConfigured, getConfigStatus } = useCloudinary();

  const handleImageUpload = (response: CloudinaryUploadResponse) => {
    setUploadedImages(prev => [...prev, response]);
    setSelectedImage(response);
  };

  const handleImageRemove = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImage === uploadedImages[index]) {
      setSelectedImage(null);
    }
  };

  const configStatus = getConfigStatus();

  if (!isConfigured) {
    return (
      <div className="cloudinary-demo">
        <div className="demo-header">
          <h2>Cloudinary Integration</h2>
          <p>Image and file upload service</p>
        </div>
        
        <div className="config-warning">
          <Settings size={24} />
          <div>
            <h3>Configuration Required</h3>
            <p>Please configure the following environment variables:</p>
            <ul>
              {configStatus.missing.map((variable: string) => (
                <li key={variable}><code>{variable}</code></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cloudinary-demo">
      <div className="demo-header">
        <Cloud size={24} />
        <div>
          <h2>Cloudinary Integration</h2>
          <p>Upload and manage images with Cloudinary</p>
        </div>
      </div>

      <div className="demo-content">
        <div className="upload-section">
          <h3>Upload Images</h3>
          <ImageUpload
            onUpload={handleImageUpload}
            folder="bestie-admin/demo"
            tags={['demo', 'admin']}
            showPreview={true}
          />
        </div>

        {uploadedImages.length > 0 && (
          <div className="images-section">
            <h3>Uploaded Images ({uploadedImages.length})</h3>
            <div className="images-grid">
              {uploadedImages.map((image, index) => (
                <div
                  key={image.public_id}
                  className={`image-item ${selectedImage?.public_id === image.public_id ? 'selected' : ''}`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.secure_url}
                    alt={`Uploaded ${index + 1}`}
                    className="image-thumbnail"
                  />
                  <div className="image-info">
                    <span className="image-name">
                      {image.public_id.split('/').pop()}
                    </span>
                    <span className="image-size">
                      {(image.bytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    className="remove-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageRemove(index);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedImage && (
          <div className="image-details">
            <h3>Image Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Public ID:</label>
                <span>{selectedImage.public_id}</span>
              </div>
              <div className="detail-item">
                <label>Format:</label>
                <span>{selectedImage.format}</span>
              </div>
              <div className="detail-item">
                <label>Size:</label>
                <span>{(selectedImage.bytes / 1024).toFixed(1)} KB</span>
              </div>
              <div className="detail-item">
                <label>Dimensions:</label>
                <span>{selectedImage.width} × {selectedImage.height}</span>
              </div>
              <div className="detail-item">
                <label>Created:</label>
                <span>{new Date(selectedImage.created_at).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="image-variants">
              <h4>Image Variants</h4>
              <div className="variants-grid">
                <div className="variant">
                  <img
                    src={`https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload/w_150,h_150,c_fill,q_auto,f_auto/${selectedImage.public_id}`}
                    alt="Thumbnail"
                  />
                  <span>Thumbnail (150×150)</span>
                </div>
                <div className="variant">
                  <img
                    src={`https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_400,c_fill,q_auto,f_auto/${selectedImage.public_id}`}
                    alt="Medium"
                  />
                  <span>Medium (400×400)</span>
                </div>
                <div className="variant">
                  <img
                    src={`https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_800,c_fill,q_auto,f_auto/${selectedImage.public_id}`}
                    alt="Large"
                  />
                  <span>Large (800×800)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudinaryDemo;
