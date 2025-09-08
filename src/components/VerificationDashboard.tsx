import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  getAllPendingVerifications,
  AllPendingVerificationsResponse,
  VerificationRequest,
  VendorVerificationRequest,
  CourierVerificationRequest
} from '../services/verification';
import { 
  Search, 
  Filter, 
  Users, 
  Truck, 
  Store, 
  Eye, 
  CheckCircle, 
  XCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import './VerificationDashboard.css';

const VerificationDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState<AllPendingVerificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    type: (searchParams.get('type') as 'vendor' | 'courier' | undefined) || undefined,
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('page_size') || '10'),
  });

  // Fetch verification requests
  const fetchVerifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllPendingVerifications(
        filters.type,
        filters.page,
        filters.pageSize,
        filters.search || undefined
      );
      
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verifications');
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update URL params when filters change
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    const params = new URLSearchParams();
    if (updatedFilters.type) params.set('type', updatedFilters.type);
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    if (updatedFilters.page > 1) params.set('page', updatedFilters.page.toString());
    if (updatedFilters.pageSize !== 10) params.set('page_size', updatedFilters.pageSize.toString());
    
    setSearchParams(params);
  };

  // Handle search
  const handleSearch = (query: string) => {
    updateFilters({ search: query, page: 1 });
  };

  // Handle type filter
  const handleTypeFilter = (type: 'vendor' | 'courier' | undefined) => {
    updateFilters({ type, page: 1 });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    updateFilters({ pageSize, page: 1 });
  };

  // Navigate to verification details
  const handleViewDetails = (request: VerificationRequest) => {
    navigate(`/verification-requests/${request.id}?type=${request.type}`);
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

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-badge pending';
      case 'approved': return 'status-badge approved';
      case 'rejected': return 'status-badge rejected';
      default: return 'status-badge pending';
    }
  };

  // Check if request is vendor
  const isVendor = (request: VerificationRequest): request is VendorVerificationRequest => {
    return request.type === 'vendor';
  };

  // Check if request is courier
  const isCourier = (request: VerificationRequest): request is CourierVerificationRequest => {
    return request.type === 'courier';
  };

  // Initial load
  useEffect(() => {
    fetchVerifications();
  }, [filters]);

  if (loading) {
    return (
      <div className="verification-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading verification requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verification-dashboard">
        <div className="error-container">
          <XCircle size={48} />
          <h3>Error Loading Verifications</h3>
          <p>{error}</p>
          <button onClick={fetchVerifications} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="verification-dashboard">
        <div className="empty-container">
          <Users size={48} />
          <h3>No Data Available</h3>
          <p>Unable to load verification data</p>
        </div>
      </div>
    );
  }

  const allRequests = [...data.vendors.results, ...data.couriers.results];

  return (
    <div className="verification-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Verification Requests</h1>
          <p className="dashboard-subtitle">Review and manage vendor and courier verifications</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">
            <Users size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-number">{data.summary.total_pending}</h3>
            <p className="card-label">Total Pending</p>
          </div>
        </div>
        
        <div className="summary-card vendors">
          <div className="card-icon">
            <Store size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-number">{data.summary.vendors_pending}</h3>
            <p className="card-label">Vendors Pending</p>
          </div>
        </div>
        
        <div className="summary-card couriers">
          <div className="card-icon">
            <Truck size={24} />
          </div>
          <div className="card-content">
            <h3 className="card-number">{data.summary.couriers_pending}</h3>
            <p className="card-label">Couriers Pending</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="dashboard-controls">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or business name..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.type || 'all'}
              onChange={(e) => handleTypeFilter(e.target.value === 'all' ? undefined : e.target.value as 'vendor' | 'courier')}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="vendor">Vendors</option>
              <option value="courier">Couriers</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Per Page:</label>
            <select
              value={filters.pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="filter-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verification Requests Table */}
      <div className="verification-table-container">
        {allRequests.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No verification requests found</h3>
            <p>No pending verification requests match your current filters</p>
          </div>
        ) : (
          <div className="verification-table">
            <div className="table-header">
              <div className="table-cell">User</div>
              <div className="table-cell">Type</div>
              <div className="table-cell">Details</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Submitted</div>
              <div className="table-cell">Actions</div>
            </div>
            
            <div className="table-body">
              {allRequests.map((request) => (
                <div key={`${request.type}-${request.id}`} className="table-row">
                  <div className="table-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {request.user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{request.user.full_name}</div>
                        <div className="user-email">{request.user.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <div className="type-badge">
                      {request.type === 'vendor' ? (
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
                    <div className="request-details">
                      {isVendor(request) ? (
                        <>
                          <div className="detail-item">
                            <strong>Business:</strong> {request.business_name}
                          </div>
                          <div className="detail-item">
                            <strong>CAC:</strong> {request.cac_number}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="detail-item">
                            <strong>Vehicle:</strong> {request.vehicle_type}
                          </div>
                          <div className="detail-item">
                            <strong>NIN:</strong> {request.nin_number}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <span className={getStatusBadgeClass(request.verification_status)}>
                      {request.verification_status}
                    </span>
                  </div>
                  
                  <div className="table-cell">
                    <div className="date-info">
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button
                        className="action-button view"
                        onClick={() => handleViewDetails(request)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {(data.vendors.num_pages > 1 || data.couriers.num_pages > 1) && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {filters.page} of {Math.max(data.vendors.num_pages, data.couriers.num_pages)}
          </div>
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page >= Math.max(data.vendors.num_pages, data.couriers.num_pages)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default VerificationDashboard;
