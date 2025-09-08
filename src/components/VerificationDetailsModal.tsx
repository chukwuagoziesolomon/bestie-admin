import React from 'react';
import { VerificationSummaryItem } from '../services/verification';
import './VerificationDetailsModal.css';

interface VerificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: VerificationSummaryItem | null;
  onApprove: () => void;
  onReject: () => void;
}

const VerificationDetailsModal: React.FC<VerificationDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}) => {
  if (!isOpen || !request) return null;

  return (
    <div className="verification-modal-overlay" onClick={onClose}>
      <div className="verification-modal" onClick={e => e.stopPropagation()}>
        <div className="verification-modal-header">
          <h3>Verification Details</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="verification-details">
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{request.full_name || 'N/A'}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Role:</span>
            <span className="detail-value">
              {request.role ? request.role.charAt(0).toUpperCase() + request.role.slice(1) : 'N/A'}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{request.phone_number || 'N/A'}</span>
          </div>
          
          {request.package_type && (
            <div className="detail-row">
              <span className="detail-label">Package Type:</span>
              <span className="detail-value">{request.package_type}</span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="detail-label">Submitted On:</span>
            <span className="detail-value">
              {request.date ? new Date(request.date).toLocaleString() : 'N/A'}
            </span>
          </div>
          
          {request.address && (
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{request.address}</span>
            </div>
          )}
          
          <div className="document-section">
            <h4>Documents</h4>
            
            <div className="document-grid">
              {request.profile_photo && (
                <div className="document-item">
                  <div className="document-label">Profile Photo</div>
                  <img 
                    src={request.profile_photo} 
                    alt="Profile" 
                    className="document-image"
                    onClick={() => window.open(request.profile_photo || '', '_blank')}
                  />
                </div>
              )}
              
              {request.id_image && (
                <div className="document-item">
                  <div className="document-label">ID Document</div>
                  <img 
                    src={request.id_image} 
                    alt="ID Document" 
                    className="document-image"
                    onClick={() => window.open(request.id_image || '', '_blank')}
                  />
                </div>
              )}
              
              {request.cac_document && (
                <div className="document-item">
                  <div className="document-label">CAC Document</div>
                  <img 
                    src={request.cac_document} 
                    alt="CAC Document" 
                    className="document-image"
                    onClick={() => window.open(request.cac_document || '', '_blank')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="verification-actions">
          <button 
            className="approve-button"
            onClick={onApprove}
          >
            Approve
          </button>
          <button 
            className="reject-button"
            onClick={onReject}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationDetailsModal;
