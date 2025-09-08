import React, { useState, useEffect } from 'react';
import { Search, Users as UsersIcon, UserCheck, UserPlus, Calendar, Filter, MoreVertical, Eye, UserX, UserCheck2, AlertTriangle } from 'lucide-react';
import { getUserCounts, getUsers, searchUsers, toggleUserStatus, User, UserCounts } from '../services/user';
import { suspendUser, activateUser, SuspendResponse, ActivateResponse } from '../services/accountManagement';
import SuspendReactivateModal from './SuspendReactivateModal';
import './Users.css';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userCounts, setUserCounts] = useState<UserCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'suspend' | 'reactivate'>('suspend');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const pageSize = 20;

  // Load user counts
  const loadUserCounts = async () => {
    try {
      const counts = await getUserCounts();
      setUserCounts(counts);
    } catch (err) {
      console.error('Failed to load user counts:', err);
    }
  };

  // Load users
  const loadUsers = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (search.trim()) {
        response = await searchUsers(search, page, pageSize);
        setIsSearching(true);
      } else {
        response = await getUsers(page, pageSize);
        setIsSearching(false);
      }
      
      setUsers(response.results);
      setTotalPages(response.num_pages);
      setTotalCount(response.count);
      setCurrentPage(response.current_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    loadUsers(1, query);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page, searchQuery);
  };

  // Handle user status toggle
  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await toggleUserStatus(userId, !currentStatus);
      // Reload users to reflect the change
      loadUsers(currentPage, searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
      console.error('Failed to toggle user status:', err);
    }
  };

  // Handle suspend/reactivate modal
  const handleSuspendReactivate = (user: User, action: 'suspend' | 'reactivate') => {
    setSelectedUser(user);
    setModalAction(action);
    setModalOpen(true);
  };

  // Handle modal confirmation
  const handleModalConfirm = async (reason: string, durationDays?: number | null) => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      
      let response: SuspendResponse | ActivateResponse;
      try {
        // Debug: Log the user data to see what IDs are available
        console.log('=== USER SUSPEND/ACTIVATE DEBUG ===');
        console.log('Selected user data:', selectedUser);
        console.log('Using user ID:', selectedUser.id);
        console.log('Modal action:', modalAction);
        
        // Try the new suspend/activate endpoints first
        if (modalAction === 'suspend') {
          response = await suspendUser(selectedUser.id, {
            reason,
            duration_days: durationDays,
            notify_user: true
          });
        } else {
          response = await activateUser(selectedUser.id, {
            reason,
            notify_user: true
          });
        }
        
        // Debug: Log the response to see the structure
        console.log('=== USER SUSPEND/ACTIVATE RESPONSE ===');
        console.log('Full response:', response);
        console.log('Response user:', response.user);
        console.log('Response user status:', response.user?.status);
        console.log('=== END RESPONSE DEBUG ===');
        
        // Update local state with the response data
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                is_active: response.user?.status === 'active'
              } 
            : user
        ));
      } catch (apiError) {
        // Fallback to the existing toggleUserStatus if the new endpoints don't exist
        console.warn('=== FALLBACK TO TOGGLE USER STATUS ===');
        console.warn('New suspend/activate endpoints not available, using fallback:', apiError);
        
        if (modalAction === 'suspend') {
          await toggleUserStatus(selectedUser.id, false);
        } else {
          await toggleUserStatus(selectedUser.id, true);
        }
        
        // Reload users to reflect the change
        loadUsers(currentPage, searchQuery);
      }
      
      setModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Close modal
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive ? 'status-badge active' : 'status-badge inactive';
  };

  // Initial load
  useEffect(() => {
    loadUserCounts();
    loadUsers();
  }, []);

  return (
    <div className="users-container">
      <div className="users-header">
        <div className="users-title-section">
          <h1 className="users-title">User Management</h1>
          <p className="users-subtitle">Manage and monitor user accounts</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {userCounts && (
        <div className="users-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <UsersIcon size={24} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{userCounts.total_regular_users.toLocaleString()}</h3>
              <p className="stat-label">Total Users</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon active">
              <UserCheck size={24} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{userCounts.active_regular_users.toLocaleString()}</h3>
              <p className="stat-label">Active Users</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon new">
              <UserPlus size={24} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{userCounts.new_users_this_month.toLocaleString()}</h3>
              <p className="stat-label">New This Month</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon recent">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{userCounts.new_users_this_week.toLocaleString()}</h3>
              <p className="stat-label">New This Week</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="users-controls">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="users-info">
          <span className="users-count">
            {isSearching ? `Found ${totalCount} users` : `Showing ${totalCount} users`}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className="error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="users-table">
            <div className="table-header">
              <div className="table-cell">IMG</div>
              <div className="table-cell">NAME</div>
              <div className="table-cell">EMAIL</div>
              <div className="table-cell">PHONE</div>
              <div className="table-cell">STATUS</div>
              <div className="table-cell">ACTIONS</div>
            </div>
            
            <div className="table-body">
              {users.length === 0 ? (
                <div className="empty-state">
                  <UsersIcon size={48} />
                  <h3>No users found</h3>
                  <p>{isSearching ? 'Try adjusting your search criteria' : 'No users have been registered yet'}</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="table-row">
                    <div className="table-cell">
                      <div className="user-avatar">
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="user-name">{user.full_name || user.username}</div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="user-email">{user.email}</div>
                    </div>
                    
                    <div className="table-cell">
                      <div className="user-phone">{user.phone || 'Not provided'}</div>
                    </div>
                    
                    <div className="table-cell">
                      <span className={getStatusBadgeClass(user.is_active)}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    
                    <div className="table-cell">
                      <div className="user-actions">
                        <button
                          className="action-button view"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {user.is_active ? (
                          <button
                            className="action-button suspend"
                            onClick={() => handleSuspendReactivate(user, 'suspend')}
                            title="Suspend User"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        ) : (
                          <button
                            className="action-button reactivate"
                            onClick={() => handleSuspendReactivate(user, 'reactivate')}
                            title="Reactivate User"
                          >
                            <UserCheck2 size={16} />
                          </button>
                        )}
                        
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Suspend/Reactivate Modal */}
      {selectedUser && (
        <SuspendReactivateModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          action={modalAction}
          accountType="user"
          accountName={selectedUser.full_name || selectedUser.username}
          accountEmail={selectedUser.email}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default Users;
