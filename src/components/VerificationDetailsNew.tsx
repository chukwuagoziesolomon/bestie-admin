import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  Phone, 
  Calendar, 
  MapPin,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  getVerificationDetails,
  approveVerification,
  rejectVerification,
  VerificationRequest,
  VendorVerificationRequest,
  CourierVerificationRequest,
  DebugFiles,
  CourierDebugFiles,
  VerificationActionResponse
} from '../services/verification';
import './VerificationDetailsNew.css';

const VerificationDetailsNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [verificationData, setVerificationData] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Get user type from URL params
  const userType = searchParams.get('type') as 'vendor' | 'courier' | null;

  // Helper functions to safely access debug_files
  const getVendorDebugFiles = (data: VerificationRequest): DebugFiles => {
    if (isVendor(data) && data.debug_files) {
      return data.debug_files;
    }
    return {
      logo_exists: false,
      cac_document_exists: false,
      valid_id_exists: false,
      logo_name: 'N/A',
      cac_document_name: 'N/A',
      valid_id_name: 'N/A'
    };
  };

  const getCourierDebugFiles = (data: VerificationRequest): CourierDebugFiles => {
    if (isCourier(data) && data.debug_files) {
      return data.debug_files;
    }
    return {
      profile_photo_exists: false,
      id_upload_exists: false,
      profile_photo_name: 'N/A',
      id_upload_name: 'N/A'
    };
  };

  // Fetch verification data
  useEffect(() => {
    const fetchVerificationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id || !userType) {
          setError('Missing verification ID or type');
          return;
        }
        
        // Fetch specific verification details using the individual endpoint
        const request = await getVerificationDetails(userType, parseInt(id));
        console.log('Fetched verification data:', request);
        setVerificationData(request);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load verification details');
        console.error('Error fetching verification data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id && userType) {
      fetchVerificationData();
    }
  }, [id, userType]);

  // Handle approve action
  const handleApprove = () => {
    setActionType('approve');
    setVerificationNotes('');
    setShowNotesModal(true);
  };

  // Handle decline action
  const handleDecline = () => {
    setActionType('reject');
    setVerificationNotes('');
    setShowNotesModal(true);
  };

  // Handle action confirmation
  const handleActionConfirm = async () => {
    if (!verificationData || !actionType || !userType) return;
    
    setActionLoading(true);
    setError(null);
    
    // Debug logging
    console.log('Action details:', {
      actionType,
      userType,
      verificationId: verificationData?.id,
      verificationNotes,
      notesLength: verificationNotes?.length
    });
    
    try {
      let response: VerificationActionResponse;
      
      if (actionType === 'approve') {
        response = await approveVerification(userType, verificationData.id, verificationNotes);
      } else {
        response = await rejectVerification(userType, verificationData.id, verificationNotes);
      }
      
      setActionSuccess(response.message);
      setShowNotesModal(false);
      
      // Update the verification data with the new status
      setVerificationData(prev => {
        if (!prev) return prev;
        
        // Safely access response data with fallbacks
        const newStatus = response?.data?.verification_status;
        const newNotes = response?.data?.verification_notes;
        
        return {
          ...prev,
          verification_status: newStatus || prev.verification_status,
          verification_notes: newNotes !== undefined ? newNotes : prev.verification_notes
        };
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/verification-requests');
      }, 2000);
      
    } catch (err: any) {
      console.error(`Error ${actionType}ing verification:`, err);
      setError(err.response?.data?.error || `Failed to ${actionType} verification. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle action cancellation
  const handleActionCancel = () => {
    setShowNotesModal(false);
    setActionType(null);
    setVerificationNotes('');
    setError(null);
  };

  // Handle image click
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowFullImage(true);
  };

  // Check if request is vendor
  const isVendor = (request: VerificationRequest): request is VendorVerificationRequest => {
    return request.type === 'vendor';
  };

  // Check if request is courier
  const isCourier = (request: VerificationRequest): request is CourierVerificationRequest => {
    return request.type === 'courier';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-badge pending';
      case 'approved': return 'status-badge approved';
      case 'rejected': return 'status-badge rejected';
      default: return 'status-badge pending';
    }
  };

  if (loading) {
    return (
      <div className="verification-details">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading verification details...</p>
        </div>
      </div>
    );
  }

  if (error || !verificationData) {
    return (
      <div className="verification-details">
        <div className="error-container">
          <XCircle size={48} />
          <h3>Error Loading Verification</h3>
          <p>{error || 'Verification request not found'}</p>
          <button onClick={() => navigate('/verification-requests')} className="back-button">
            <ArrowLeft size={16} />
            Back to Verifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-details">
      {/* Header */}
      <div className="details-header">
        <button 
          onClick={() => navigate('/verification-requests')} 
          className="back-button"
        >
          <ArrowLeft size={20} />
          Back to Verifications
        </button>
        
        <div className="header-info">
          <h1 className="page-title">Verification Details</h1>
          <span className={getStatusBadgeClass(verificationData.verification_status)}>
            {verificationData.verification_status}
          </span>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="profile-section">
        <div className="profile-content">
          <div className="profile-avatar">
            {isVendor(verificationData) && verificationData.logo ? (
              <img 
                src={verificationData.logo} 
                alt="Business Logo" 
                className="avatar-image"
              />
            ) : isCourier(verificationData) && verificationData.profile_photo ? (
              <img 
                src={verificationData.profile_photo} 
                alt="Profile Photo" 
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                <User size={48} />
              </div>
            )}
          </div>
          
          <div className="profile-details">
            <div className="detail-row">
              <div className="detail-item">
                <label>Full Name</label>
                <span>{verificationData.user.full_name}</span>
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <span>{verificationData.phone}</span>
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-item">
                <label>Date</label>
                <span>{formatDate(verificationData.created_at)}</span>
              </div>
              <div className="detail-item">
                <label>Role</label>
                <span className="role-badge">
                  {verificationData.type === 'vendor' ? 'Vendor' : 'Courier'}
                </span>
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-item">
                <label>Email</label>
                <span>{verificationData.user.email}</span>
              </div>
              <div className="detail-item">
                <label>Date Joined</label>
                <span>{formatDate(verificationData.user.date_joined)}</span>
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-item">
                <label>Address</label>
                <span>
                  {isVendor(verificationData) 
                    ? verificationData.business_address 
                    : isCourier(verificationData) 
                      ? verificationData.service_areas 
                      : 'N/A'
                  }
                </span>
              </div>
              <div className="detail-item">
                <label>Verification Status</label>
                <span className={getStatusBadgeClass(verificationData.verification_status)}>
                  {verificationData.verification_status}
                </span>
              </div>
            </div>
            
            {/* Additional vendor-specific information */}
            {isVendor(verificationData) && (
              <div className="detail-row">
                <div className="detail-item">
                  <label>Business Name</label>
                  <span>{verificationData.business_name}</span>
                </div>
                <div className="detail-item">
                  <label>CAC Number</label>
                  <span>{verificationData.cac_number}</span>
                </div>
              </div>
            )}
            
            {/* Additional courier-specific information */}
            {isCourier(verificationData) && (
              <div className="detail-row">
                <div className="detail-item">
                  <label>Vehicle Type</label>
                  <span>{verificationData.vehicle_type}</span>
                </div>
                <div className="detail-item">
                  <label>Delivery Radius</label>
                  <span>{verificationData.delivery_radius}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Identification Details Section */}
      <div className="identification-section">
        <h2 className="section-title">Identification Details</h2>
        
        <div className="document-viewer">
          <div className="document-image">
            {isVendor(verificationData) ? (
              <img 
                src={verificationData.valid_id} 
                alt="Valid ID Document" 
                className="document-photo"
                onClick={() => handleImageClick(verificationData.valid_id)}
              />
            ) : isCourier(verificationData) ? (
              <img 
                src={verificationData.id_upload} 
                alt="ID Upload Document" 
                className="document-photo"
                onClick={() => handleImageClick(verificationData.id_upload)}
              />
            ) : null}
          </div>
          
          <div className="document-info">
            <div className="info-item">
              <label>NIN</label>
              <span>
                {isVendor(verificationData) 
                  ? 'N/A' 
                  : isCourier(verificationData) 
                    ? verificationData.nin_number 
                    : 'N/A'
                }
              </span>
            </div>
            
            {/* Verification Notes */}
            {verificationData.verification_notes && (
              <div className="verification-notes">
                <h4>Verification Notes</h4>
                <p>{verificationData.verification_notes}</p>
              </div>
            )}
            
            {/* Verification Alerts */}
            <div className="verification-alerts">
              <div className="alert alert-warning">
                <AlertTriangle size={16} />
                <span>Number doesn't match the one you uploaded</span>
              </div>
              
              <div className="alert alert-error">
                <XCircle size={16} />
                <span>Number doesn't match the one you uploaded</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Documents for Vendors */}
      {isVendor(verificationData) && (
        <div className="additional-documents">
          <h3 className="section-subtitle">Business Documents</h3>
          
          <div className="documents-grid">
            <div className="document-item">
              <h4>CAC Document</h4>
              <img 
                src={verificationData.cac_document} 
                alt="CAC Document" 
                className="document-thumbnail"
                onClick={() => handleImageClick(verificationData.cac_document)}
              />
              <div className="document-status">
                <span className={`status-indicator ${getVendorDebugFiles(verificationData).cac_document_exists ? 'exists' : 'missing'}`}>
                  {getVendorDebugFiles(verificationData).cac_document_exists ? '✓ Available' : '✗ Missing'}
                </span>
              </div>
            </div>
            
            <div className="document-item">
              <h4>Business Logo</h4>
              <img 
                src={verificationData.logo} 
                alt="Business Logo" 
                className="document-thumbnail"
                onClick={() => handleImageClick(verificationData.logo)}
              />
              <div className="document-status">
                <span className={`status-indicator ${getVendorDebugFiles(verificationData).logo_exists ? 'exists' : 'missing'}`}>
                  {getVendorDebugFiles(verificationData).logo_exists ? '✓ Available' : '✗ Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Status Information */}
      <div className="document-status-section">
        <h3 className="section-subtitle">Document Status</h3>
        
        <div className="status-grid">
          {isVendor(verificationData) ? (
            <>
              <div className="status-item">
                <div className="status-header">
                  <span className="status-label">Valid ID</span>
                  <span className={`status-badge ${getVendorDebugFiles(verificationData).valid_id_exists ? 'success' : 'error'}`}>
                    {getVendorDebugFiles(verificationData).valid_id_exists ? 'Available' : 'Missing'}
                  </span>
                </div>
                <div className="status-details">
                  <span className="file-name">{getVendorDebugFiles(verificationData).valid_id_name}</span>
                </div>
              </div>
              
              <div className="status-item">
                <div className="status-header">
                  <span className="status-label">CAC Document</span>
                  <span className={`status-badge ${getVendorDebugFiles(verificationData).cac_document_exists ? 'success' : 'error'}`}>
                    {getVendorDebugFiles(verificationData).cac_document_exists ? 'Available' : 'Missing'}
                  </span>
                </div>
                <div className="status-details">
                  <span className="file-name">{getVendorDebugFiles(verificationData).cac_document_name}</span>
                </div>
              </div>
              
              <div className="status-item">
                <div className="status-header">
                  <span className="status-label">Business Logo</span>
                  <span className={`status-badge ${getVendorDebugFiles(verificationData).logo_exists ? 'success' : 'error'}`}>
                    {getVendorDebugFiles(verificationData).logo_exists ? 'Available' : 'Missing'}
                  </span>
                </div>
                <div className="status-details">
                  <span className="file-name">{getVendorDebugFiles(verificationData).logo_name}</span>
                </div>
              </div>
            </>
          ) : isCourier(verificationData) ? (
            <>
              <div className="status-item">
                <div className="status-header">
                  <span className="status-label">Profile Photo</span>
                  <span className={`status-badge ${getCourierDebugFiles(verificationData).profile_photo_exists ? 'success' : 'error'}`}>
                    {getCourierDebugFiles(verificationData).profile_photo_exists ? 'Available' : 'Missing'}
                  </span>
                </div>
                <div className="status-details">
                  <span className="file-name">{getCourierDebugFiles(verificationData).profile_photo_name}</span>
                </div>
              </div>
              
              <div className="status-item">
                <div className="status-header">
                  <span className="status-label">ID Upload</span>
                  <span className={`status-badge ${getCourierDebugFiles(verificationData).id_upload_exists ? 'success' : 'error'}`}>
                    {getCourierDebugFiles(verificationData).id_upload_exists ? 'Available' : 'Missing'}
                  </span>
                </div>
                <div className="status-details">
                  <span className="file-name">{getCourierDebugFiles(verificationData).id_upload_name}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="action-button decline"
          onClick={handleDecline}
          disabled={processing}
        >
          <XCircle size={20} />
          Decline
        </button>
        
        <button 
          className="action-button approve"
          onClick={handleApprove}
          disabled={processing}
        >
          <CheckCircle size={20} />
          Approve
        </button>
      </div>

      {/* Image Modal */}
      {showFullImage && selectedImage && (
        <div className="image-modal" onClick={() => setShowFullImage(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-button"
              onClick={() => setShowFullImage(false)}
            >
              <XCircle size={24} />
            </button>
            <img src={selectedImage} alt="Document" className="modal-image" />
          </div>
        </div>
      )}

      {/* Verification Notes Modal */}
      {showNotesModal && (
        <div className="verification-notes-modal" onClick={handleActionCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionType === 'approve' ? 'Approve Verification' : 'Reject Verification'}
              </h3>
              <button 
                className="close-button"
                onClick={handleActionCancel}
                disabled={actionLoading}
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                {actionType === 'approve' 
                  ? 'Please provide any additional notes for this approval (optional):'
                  : 'Please provide a reason for rejecting this verification:'
                }
              </p>
              
              <textarea
                className="verification-notes-input"
                placeholder={
                  actionType === 'approve' 
                    ? 'Add any notes about this approval...'
                    : 'Explain why this verification is being rejected...'
                }
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={4}
                required={actionType === 'reject'}
                disabled={actionLoading}
              />
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-button cancel"
                onClick={handleActionCancel}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className={`modal-button ${actionType === 'approve' ? 'approve' : 'reject'}`}
                onClick={handleActionConfirm}
                disabled={actionLoading || (actionType === 'reject' && !verificationNotes.trim())}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === 'approve' ? (
                      <>
                        <CheckCircle size={16} />
                        Approve
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Reject
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {actionSuccess && (
        <div className="success-overlay">
          <div className="success-message">
            <CheckCircle size={48} className="success-icon" />
            <h3>Success!</h3>
            <p>{actionSuccess}</p>
            <p className="redirect-message">Redirecting to verification requests...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationDetailsNew;
