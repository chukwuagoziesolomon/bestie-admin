import React, { useState, useEffect } from 'react';
import { 
  UserX, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  UserCheck2,
  Eye,
  MoreVertical,
  Users,
  Store,
  Truck
} from 'lucide-react';
import './SuspendedUsers.css';
import { 
  getSuspendedUsers, 
  reactivateVendor, 
  reactivateCourier,
  SuspendedUsersResponse,
  SuspendedVendor,
  SuspendedCourier
} from '../services/suspendedUsers';

const SuspendedUsers: React.FC = () => {
  const [data, setData] = useState<SuspendedUsersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'vendors' | 'couriers'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [selectedUser, setSelectedUser] = useState<SuspendedVendor | SuspendedCourier | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [reactivationError, setReactivationError] = useState<string | null>(null);

  // Fetch suspended users
  const fetchSuspendedUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        page_size: pageSize
      };
      
      if (activeTab !== 'all') {
        params.type = activeTab === 'vendors' ? 'vendor' : 'courier';
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await getSuspendedUsers(params);
      setData(response);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Error fetching suspended users:', err);
      setError(err.message || 'Failed to load suspended users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchSuspendedUsers(1);
  };

  // Handle tab change
  const handleTabChange = (tab: 'all' | 'vendors' | 'couriers') => {
    setActiveTab(tab);
    setCurrentPage(1);
    fetchSuspendedUsers(1);
  };

  // Handle reactivation
  const handleReactivate = (user: SuspendedVendor | SuspendedCourier) => {
    setSelectedUser(user);
    setReactivationError(null);
    setModalOpen(true);
  };

  // Handle modal confirmation
  const handleModalConfirm = async (reason: string) => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      setReactivationError(null);
      
      console.log('=== REACTIVATION DEBUG ===');
      console.log('Selected user:', selectedUser);
      console.log('User type:', 'business_name' in selectedUser ? 'vendor' : 'courier');
      console.log('User ID:', selectedUser.id);
      console.log('Reason:', reason);
      
      if ('business_name' in selectedUser) {
        // It's a vendor
        console.log('Calling reactivateVendor with ID:', selectedUser.id);
        await reactivateVendor(selectedUser.id, reason);
      } else {
        // It's a courier
        console.log('Calling reactivateCourier with ID:', selectedUser.id);
        await reactivateCourier(selectedUser.id, reason);
      }
      
      console.log('Reactivation successful, refreshing data...');
      
      // Refresh the data
      await fetchSuspendedUsers(currentPage);
      
      setModalOpen(false);
      setSelectedUser(null);
      setReactivationError(null);
    } catch (err: any) {
      console.error('Error reactivating user:', err);
      setReactivationError(err.message || 'Failed to reactivate user. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setReactivationError(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (days: number | null) => {
    if (days === null) return 'Permanent';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  // Get total count
  const getTotalCount = () => {
    if (!data) return 0;
    return data.suspended_vendors.count + data.suspended_couriers.count;
  };

  // Get all suspended users for display
  const getAllSuspendedUsers = () => {
    if (!data) return [];
    
    const vendors = data.suspended_vendors.results.map(vendor => ({
      ...vendor,
      type: 'vendor' as const
    }));
    
    const couriers = data.suspended_couriers.results.map(courier => ({
      ...courier,
      type: 'courier' as const
    }));
    
    return [...vendors, ...couriers];
  };

  // Initial load
  useEffect(() => {
    fetchSuspendedUsers();
  }, []);

  return (
    <div className="suspended-users-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <UserX size={32} className="header-icon" />
            <div>
              <h1>Suspended Users</h1>
              <p>Manage suspended vendors and couriers</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{getTotalCount()}</span>
                <span className="stat-label">Total Suspended</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Store size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{data?.suspended_vendors.count || 0}</span>
                <span className="stat-label">Vendors</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Truck size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{data?.suspended_couriers.count || 0}</span>
                <span className="stat-label">Couriers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="search-section">
          <div className="search-input-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or business name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filters-section">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All ({getTotalCount()})
            </button>
            <button
              className={`filter-tab ${activeTab === 'vendors' ? 'active' : ''}`}
              onClick={() => handleTabChange('vendors')}
            >
              Vendors ({data?.suspended_vendors.count || 0})
            </button>
            <button
              className={`filter-tab ${activeTab === 'couriers' ? 'active' : ''}`}
              onClick={() => handleTabChange('couriers')}
            >
              Couriers ({data?.suspended_couriers.count || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content-section">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading suspended users...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <AlertTriangle size={24} />
            <p>{error}</p>
            <button onClick={() => fetchSuspendedUsers(currentPage)}>Retry</button>
          </div>
        ) : (
          <div className="suspended-users-table">
            <div className="table-header">
              <div className="table-cell">Type</div>
              <div className="table-cell">Name</div>
              <div className="table-cell">Email</div>
              <div className="table-cell">Suspension Reason</div>
              <div className="table-cell">Suspended Date</div>
              <div className="table-cell">Duration</div>
              <div className="table-cell">Actions</div>
            </div>
            
            <div className="table-body">
              {getAllSuspendedUsers().length === 0 ? (
                <div className="empty-state">
                  <UserX size={48} />
                  <h3>No suspended users found</h3>
                  <p>All users are currently active</p>
                </div>
              ) : (
                getAllSuspendedUsers().map((user) => (
                  <div key={`${user.type}-${user.id}`} className="table-row">
                    <div className="table-cell">
                      <div className="user-type">
                        {user.type === 'vendor' ? (
                          <>
                            <Store size={16} />
                            <span>Vendor</span>
                          </>
                        ) : (
                          <>
                            <Truck size={16} />
                            <span>Courier</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="user-name">
                        {'business_name' in user ? user.business_name : user.full_name}
                      </div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="user-email">{user.email}</div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="suspension-reason">{user.suspension_reason}</div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="suspension-date">
                        <Calendar size={14} />
                        <span>{formatDate(user.suspension_date)}</span>
                      </div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="suspension-duration">
                        <Clock size={14} />
                        <span>{formatDuration(user.suspension_duration_days)}</span>
                      </div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="user-actions">
                        <button
                          className="action-button view"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          className="action-button reactivate"
                          onClick={() => handleReactivate(user)}
                          title="Reactivate User"
                        >
                          <UserCheck2 size={16} />
                        </button>
                        
                        <button
                          className="action-button more"
                          title="More Options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reactivation Modal */}
      {modalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-icon">
                  <UserCheck2 size={20} />
                </div>
                <div>
                  <h3>Reactivate User</h3>
                  <p>Reactivate {'business_name' in selectedUser ? selectedUser.business_name : selectedUser.full_name}</p>
                </div>
              </div>
              <button className="modal-close" onClick={handleModalClose}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {reactivationError && (
                <div className="error-message-inline">
                  <AlertTriangle size={16} />
                  <span>{reactivationError}</span>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="reactivation-reason">Reactivation Reason</label>
                <textarea
                  id="reactivation-reason"
                  placeholder="Enter reason for reactivation..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleModalClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const reason = (document.getElementById('reactivation-reason') as HTMLTextAreaElement)?.value || '';
                  handleModalConfirm(reason);
                }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Reactivating...' : 'Reactivate User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspendedUsers;
