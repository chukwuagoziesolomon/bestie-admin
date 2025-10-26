import React, { useState, useEffect } from 'react';
import { Eye, AlertTriangle, UserCheck2, MoreVertical } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { suspendCourier, activateCourier, SuspendResponse, ActivateResponse } from '../services/accountManagement';
import SuspendReactivateModal from './SuspendReactivateModal';
import './Couriers.css';

// Auth functions
const getAuthToken = () => localStorage.getItem('access-token');
const removeAuthToken = () => {
  localStorage.removeItem('access-token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

interface Courier {
  id: number; // Courier Profile ID (1-6) - USE THIS for suspension
  user_id: number; // User ID (18+) - for reference only
  name: string;
  email: string;
  phone: string;
  profile_image: string;
  completed_deliveries: number;
  rating: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  joined_date: string;
  vehicle_type: string;
  
  // New suspension fields
  is_suspended: boolean;
  suspension_reason: string | null;
  suspension_date: string | null;
  suspension_duration_days: number | null;
  activation_date: string | null;
  
  user?: {
    id: number; // User ID (18+)
    email: string;
    first_name: string;
    last_name: string;
  };
}

const Couriers: React.FC = () => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('user__date_joined');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    pageSize: 10
  });
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'suspend' | 'reactivate'>('suspend');
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Map frontend field names to backend field names
  const mapFieldToBackend = (field: string): string | null => {
    // Only include fields that we know exist on the backend
    const fieldMap: Record<string, string> = {
      'name': 'user__first_name',
      'email': 'user__email',
      'phone': 'phone',
      'completed_deliveries': 'completed_deliveries',
      'verification_status': 'verification_status',
      'joined_date': 'user__date_joined'
    };
    return fieldMap[field] || null;
  };
  
  // List of sortable fields that have backend mappings
  const sortableFields = ['name', 'email', 'phone', 'completed_deliveries', 'verification_status', 'joined_date'];

  // Fetch couriers from API
  const fetchCouriers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters - explicitly set ordering to empty to prevent default
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pagination.pageSize.toString(),
        ordering: '' // Explicitly set empty ordering to prevent backend defaults
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (activeTab === 'pending') {
        params.append('verification_status', 'pending');
      }
      
      // Only add ordering if we have a valid sort field from our whitelist
      if (sortField && sortableFields.includes(sortField)) {
        const backendField = mapFieldToBackend(sortField);
        if (backendField) {
          // Replace the empty ordering with our sort
          params.set('ordering', sortDirection === 'desc' ? `-${backendField}` : backendField);
        }
      }
      
      const queryString = params.toString();
      const url = `/api/user/couriers/${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiFetch(url);
      
      // Debug: Log the courier data to see what IDs are being returned
      console.log('Fetched couriers data:', data.results);
      console.log('Sample courier object:', data.results[0]);
      
      setCouriers(data.results);
      setPagination(prev => ({
        ...prev,
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: page
      }));
    } catch (err: any) {
      console.error('Error fetching couriers:', err);
      setError(err.message || 'Failed to load couriers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCouriers(1); // Reset to first page on new search
  };
  
  // Handle tab change
  const handleTabChange = (tab: 'all' | 'pending') => {
    setActiveTab(tab);
    fetchCouriers(1); // Reset to first page on tab change
  };
  
  // Handle column sorting
  const handleSort = (field: string) => {
    // Only allow sorting on whitelisted fields
    if (!sortableFields.includes(field)) return;
    
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Set new field with default descending sort
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchCouriers(page);
  };

  // Handle verification status change
  const handleVerify = async (id: number, verify: boolean) => {
    try {
      await apiFetch(`/user/couriers/${id}/verify/`, {
        method: 'POST',
        body: JSON.stringify({ 
          action: verify ? 'approve' : 'reject',
          notes: verify ? 'Approved by admin' : 'Rejected by admin'
        })
      });
      
      // Update local state without refetching
      setCouriers(couriers.map(courier => 
        courier.id === id 
          ? { ...courier, verification_status: verify ? 'verified' : 'rejected' } 
          : courier
      ));
    } catch (err: any) {
      console.error('Error updating verification status:', err);
      setError(err.message || 'Failed to update verification status');
    }
  };
  
  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await apiFetch(`/user/couriers/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive })
      });
      
      // Update local state without refetching
      setCouriers(couriers.map(courier => 
        courier.id === id 
          ? { ...courier, is_active: isActive } 
          : courier
      ));
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    }
  };

  // Handle suspend/reactivate modal
  const handleSuspendReactivate = (courier: Courier, action: 'suspend' | 'reactivate') => {
    setSelectedCourier(courier);
    setModalAction(action);
    setModalOpen(true);
  };

  // Handle modal confirmation
  const handleModalConfirm = async (reason: string, durationDays?: number | null) => {
    if (!selectedCourier) return;

    try {
      setIsProcessing(true);
      
      let response: SuspendResponse | ActivateResponse;
      
      // Debug: Log the courier data to see what IDs are available
      console.log('=== COURIER DEBUG INFO ===');
      console.log('Full courier object:', selectedCourier);
      console.log('Courier Profile ID (id field):', selectedCourier.id);
      console.log('User ID (user_id field):', selectedCourier.user_id);
      if (selectedCourier.user) {
        console.log('User object ID:', selectedCourier.user.id);
      }
      
      // Use courier.id (Courier Profile ID) - this should be 1-6
      const courierIdToUse = selectedCourier.id;
      
      console.log('Using Courier Profile ID for API call:', courierIdToUse);
      console.log('=== END DEBUG ===');
      
      if (modalAction === 'suspend') {
        response = await suspendCourier(courierIdToUse, {
          reason,
          duration_days: durationDays,
          notify_user: true
        });
      } else {
        response = await activateCourier(courierIdToUse, {
          reason,
          notify_user: true
        });
      }
      
      // Update local state with the response data
      setCouriers(couriers.map(courier => 
        courier.id === selectedCourier.id 
          ? { 
              ...courier, 
              is_active: response.user.status === 'active'
            } 
          : courier
      ));
      
      setModalOpen(false);
      setSelectedCourier(null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update courier status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Close modal
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCourier(null);
  };

  // Delete courier
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this courier?')) {
      return;
    }
    
    try {
      await apiFetch(`/user/couriers/${id}/`, {
        method: 'DELETE'
      });
      
      // Remove the courier from the list
      setCouriers(couriers.filter(courier => courier.id !== id));
    } catch (err: any) {
      console.error('Error deleting courier:', err);
      setError(err.message || 'Failed to delete courier');
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      // Handle ISO 8601 format with timezone
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If parsing fails, try removing timezone offset
        const dateWithoutTimezone = dateString.split('+')[0];
        const parsedDate = new Date(dateWithoutTimezone);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
        return parsedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'N/A';
    }
  };

  // Get sort icon - only show for sortable fields
  const getSortIcon = (field: string) => {
    if (!sortableFields.includes(field) || sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Get dropdown items for actions
  const getDropdownItems = (courier: Courier) => {
    const items = [];
    
    items.push({
      label: 'View Details',
      onClick: () => console.log('View courier details:', courier.id),
      icon: <Eye size={16} />
    });
    
    if (courier.verification_status === 'pending') {
      items.push({
        label: 'Approve',
        onClick: () => handleVerify(courier.id, true)
      });
      items.push({
        label: 'Reject',
        onClick: () => handleVerify(courier.id, false)
      });
    }
    
    if (courier.is_active) {
      items.push({
        label: 'Suspend',
        onClick: () => handleSuspendReactivate(courier, 'suspend'),
        icon: <AlertTriangle size={16} />,
        className: 'suspend-action'
      });
    } else {
      items.push({
        label: 'Reactivate',
        onClick: () => handleSuspendReactivate(courier, 'reactivate'),
        icon: <UserCheck2 size={16} />,
        className: 'reactivate-action'
      });
    }
    
    items.push({
      label: 'Delete',
      onClick: () => handleDelete(courier.id),
      className: 'delete-action'
    });
    
    return items;
  };
  
  // Get avatar fallback
  const getAvatarFallback = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  // Star icon component
  const Star = ({ size, className }: { size: number; className?: string }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      style={{ color: '#FFD700' }}
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
  
  // Dropdown component
  const Dropdown = ({ items }: { items: Array<{ label: string; onClick: () => void; className?: string }> }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    
    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    return (
      <div className="dropdown" ref={dropdownRef}>
        <button 
          className="dropdown-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          Actions
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>
        {isOpen && (
          <div className="dropdown-menu">
            {items.map((item, index) => (
              <button
                key={index}
                className={`dropdown-item ${item.className || ''}`}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchCouriers();
  }, [activeTab, searchQuery, sortField, sortDirection]);

  return (
    <div className="couriers-page">
      {/* Header */}
      <div className="couriers-header">
        <div>
          <h1 className="couriers-title">Couriers</h1>
          <p className="couriers-subtitle">Manage and verify the couriers on your platform</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="couriers-toolbar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="couriers-tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All
          </button>
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => handleTabChange('pending')}
          >
            Pending Verification
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && couriers.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading couriers...</p>
        </div>
      ) : (
        /* Table */
        <div className="couriers-table-container">
          {couriers.length > 0 ? (
            <table className="couriers-table">
              <thead>
                <tr>
                  <th>IMG</th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('name')}
                  >
                    NAME {getSortIcon('name')}
                  </th>
                  <th>PHONE</th>
                  <th>DELIVERIES</th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('rating')}
                  >
                    RATING {getSortIcon('rating')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('verification_status')}
                  >
                    STATUS {getSortIcon('verification_status')}
                  </th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {couriers.map((courier) => (
                  <tr key={courier.id}>
                    <td>
                      <div className="courier-avatar">
                        {courier.profile_image ? (
                          <img 
                            src={courier.profile_image} 
                            alt={courier.name} 
                            className="avatar-image"
                          />
                        ) : (
                          <span className="avatar-fallback">
                            {getAvatarFallback(courier.name)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="courier-name">{courier.name}</td>
                    <td className="courier-phone">{courier.phone}</td>
                    <td className="courier-deliveries">
                      {courier.completed_deliveries ? courier.completed_deliveries.toLocaleString() : '0'}
                    </td>
                    <td className="courier-rating">
                      <div className="rating">
                        <Star size={16} className="star-icon" />
                        <span>{courier.rating ? courier.rating.toFixed(1) : '0.0'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${courier.verification_status}`}>
                        {courier.verification_status.charAt(0).toUpperCase() + courier.verification_status.slice(1)}
                      </span>
                      {courier.is_suspended && (
                        <span className="status-badge suspended">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="courier-actions">
                        <button
                          className="action-button view"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {courier.is_suspended ? (
                          <button
                            className="action-button reactivate"
                            onClick={() => handleSuspendReactivate(courier, 'reactivate')}
                            title="Reactivate Courier"
                          >
                            <UserCheck2 size={16} />
                          </button>
                        ) : (
                          <button
                            className="action-button suspend"
                            onClick={() => handleSuspendReactivate(courier, 'suspend')}
                            title="Suspend Courier"
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
          ) : (
            <div className="no-results">
              <p>No couriers found</p>
            </div>
          )}
        </div>
      )}

      {/* Suspend/Reactivate Modal */}
      {selectedCourier && (
        <SuspendReactivateModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          action={modalAction}
          accountType="courier"
          accountName={selectedCourier.name}
          accountEmail={selectedCourier.email}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default Couriers;
