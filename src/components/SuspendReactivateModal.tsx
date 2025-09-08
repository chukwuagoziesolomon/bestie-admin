import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react';
import './SuspendReactivateModal.css';

interface SuspendReactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, durationDays?: number | null) => Promise<void>;
  action: 'suspend' | 'reactivate';
  accountType: 'user' | 'vendor' | 'courier';
  accountName: string;
  accountEmail: string;
  isProcessing?: boolean;
}

const SuspendReactivateModal: React.FC<SuspendReactivateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  accountType,
  accountName,
  accountEmail,
  isProcessing = false
}) => {
  const [reason, setReason] = useState('');
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (action === 'suspend' && !reason.trim()) {
      setError('Please provide a reason for suspension');
      return;
    }

    try {
      setError(null);
      await onConfirm(reason.trim(), durationDays);
      setReason('');
      setDurationDays(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setReason('');
      setDurationDays(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isSuspend = action === 'suspend';
  const actionText = isSuspend ? 'Suspend' : 'Reactivate';
  const actionColor = isSuspend ? '#ef4444' : '#10b981';
  const ActionIcon = isSuspend ? AlertTriangle : CheckCircle;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <div className="modal-icon" style={{ backgroundColor: `${actionColor}20`, color: actionColor }}>
              <ActionIcon size={20} />
            </div>
            <div>
              <h3>{actionText} {accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account</h3>
              <p className="modal-subtitle">
                {isSuspend 
                  ? 'This will prevent the account from accessing the platform'
                  : 'This will restore access to the platform'
                }
              </p>
            </div>
          </div>
          <button 
            className="modal-close" 
            onClick={handleClose}
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="account-info">
            <div className="account-details">
              <div className="account-name">{accountName}</div>
              <div className="account-email">{accountEmail}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {isSuspend && (
              <>
                <div className="form-group">
                  <label htmlFor="reason" className="form-label">
                    Reason for Suspension <span className="required">*</span>
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason for suspending this account..."
                    className="form-textarea"
                    rows={4}
                    required
                    disabled={isProcessing}
                  />
                  <div className="form-help">
                    This reason will be visible to the account holder
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="duration" className="form-label">
                    Suspension Duration (Optional)
                  </label>
                  <select
                    id="duration"
                    value={durationDays || ''}
                    onChange={(e) => setDurationDays(e.target.value ? Number(e.target.value) : null)}
                    className="form-select"
                    disabled={isProcessing}
                  >
                    <option value="">Permanent (until manually reactivated)</option>
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">1 Week</option>
                    <option value="14">2 Weeks</option>
                    <option value="30">1 Month</option>
                    <option value="90">3 Months</option>
                  </select>
                  <div className="form-help">
                    Leave empty for permanent suspension
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="error-message">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: actionColor }}
                disabled={isProcessing || (isSuspend && !reason.trim())}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    Processing...
                  </>
                ) : (
                  `${actionText} Account`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuspendReactivateModal;
