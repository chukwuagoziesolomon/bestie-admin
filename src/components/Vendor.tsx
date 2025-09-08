import React, { useState, useEffect } from 'react';
import { Search, Clock, Check, X, Eye, AlertTriangle, UserCheck2, MoreVertical } from 'lucide-react';
import './Vendor.css';
import { apiFetch } from '../utils/api';
import { suspendVendor, activateVendor, SuspendResponse, ActivateResponse } from '../services/accountManagement';
import SuspendReactivateModal from './SuspendReactivateModal';

interface Vendor {
  id: number; // Vendor Profile ID - USE THIS for suspension
  user_id: number; // User ID (18+) - for reference only
  business_name: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  business_category: string;
  phone: string;
  email: string;
  business_address: string;
  cac_number: string;
  logo: string | null;
  cac_document: string | null;
  valid_id: string | null;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  
  // New suspension fields
  is_suspended: boolean;
  suspension_reason: string | null;
  suspension_date: string | null;
  suspension_duration_days: number | null;
  activation_date: string | null;
  
  user: {
    id: number; // User ID (18+)
    email: string;
    first_name: string;
    last_name: string;
  };
  products_count?: number;
}

const Vendor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'suspend' | 'reactivate'>('suspend');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchVendors = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (activeTab === 'pending') {
        params.append('verification_status', 'pending');
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const endpoint = activeTab === 'pending' 
        ? '/api/admin/vendors/pending/' 
        : `/api/admin/vendors/?${params.toString()}`;
      const data = await apiFetch(endpoint);
      
      setVendors(data.results || []);
      setTotalPages(data.num_pages || 1);
      setCurrentPage(data.current_page || 1);
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors. Please try again.');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(1);
  }, [activeTab, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchVendors(page);
  };

  // Handle suspend/reactivate modal
  const handleSuspendReactivate = (vendor: Vendor, action: 'suspend' | 'reactivate') => {
    setSelectedVendor(vendor);
    setModalAction(action);
    setModalOpen(true);
  };

  // Handle modal confirmation
  const handleModalConfirm = async (reason: string, durationDays?: number | null) => {
    if (!selectedVendor) return;

    try {
      setIsProcessing(true);
      
      // Debug: Log the vendor data to see what IDs are available
      console.log('=== VENDOR DEBUG INFO ===');
      console.log('Full vendor object:', selectedVendor);
      console.log('Vendor Profile ID (id field):', selectedVendor.id);
      console.log('User ID (user_id field):', selectedVendor.user_id);
      if (selectedVendor.user) {
        console.log('User object ID:', selectedVendor.user.id);
      }
      
      // Use vendor.id (Vendor Profile ID) - this should be the correct ID
      const vendorIdToUse = selectedVendor.id;
      
      console.log('Using Vendor Profile ID for API call:', vendorIdToUse);
      console.log('=== END DEBUG ===');
      
      let response: SuspendResponse | ActivateResponse;
      if (modalAction === 'suspend') {
        response = await suspendVendor(vendorIdToUse, {
          reason,
          duration_days: durationDays,
          notify_user: true
        });
      } else {
        response = await activateVendor(vendorIdToUse, {
          reason,
          notify_user: true
        });
      }
      
      // Update local state with the response data
      setVendors(vendors.map(vendor => 
        vendor.id === selectedVendor.id 
          ? { 
              ...vendor, 
              is_active: response.user.status === 'active',
              status: response.user.status
            } 
          : vendor
      ));
      
      setModalOpen(false);
      setSelectedVendor(null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update vendor status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Close modal
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedVendor(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="status-badge approved">
            <Check size={14} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge rejected">
            <X size={14} /> Rejected
          </span>
        );
      default:
        return (
          <span className="status-badge pending">
            <Clock size={14} /> Pending
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };


  return (
    <div className="vendor-page">
      <div className="vendor-header">
        <div>
          <h1 className="vendor-title">Vendors</h1>
          <p className="vendor-subtitle">View and manage vendor accounts</p>
        </div>
      </div>

      <div className="vendor-toolbar">
        <form onSubmit={handleSearch} className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>

        <div className="vendor-tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Vendors
          </button>
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Verification
          </button>
        </div>
      </div>

      <div className="vendor-table-container">
        {loading && vendors.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading vendors...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
            <button onClick={() => fetchVendors(currentPage)}>Retry</button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="no-results">
            <p>No vendors found</p>
          </div>
        ) : (
          <>
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>IMG</th>
                  <th>NAME</th>
                  <th>PHONE</th>
                  <th>PRODUCTS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>
                      <div className="vendor-avatar">
                        <span>{getInitials(vendor.business_name)}</span>
                      </div>
                    </td>
                    <td className="vendor-name">{vendor.business_name}</td>
                    <td className="vendor-phone">{vendor.phone}</td>
                    <td className="vendor-products">
                      {vendor.products_count || 0}
                    </td>
                    <td>
                      {getStatusBadge(vendor.verification_status)}
                      {vendor.is_suspended && (
                        <span className="status-badge suspended">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="vendor-actions">
                        <button
                          className="action-button view"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {vendor.is_suspended ? (
                          <button
                            className="action-button reactivate"
                            onClick={() => handleSuspendReactivate(vendor, 'reactivate')}
                            title="Reactivate Vendor"
                          >
                            <UserCheck2 size={16} />
                          </button>
                        ) : (
                          <button
                            className="action-button suspend"
                            onClick={() => handleSuspendReactivate(vendor, 'suspend')}
                            title="Suspend Vendor"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        )}
                        
                        <button
                          className="action-button more"
                          title="More Options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Suspend/Reactivate Modal */}
      {selectedVendor && (
        <SuspendReactivateModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          action={modalAction}
          accountType="vendor"
          accountName={selectedVendor.business_name}
          accountEmail={selectedVendor.user.email}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default Vendor;
