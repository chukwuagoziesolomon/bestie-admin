import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  getVerificationSummary, 
  VerificationSummaryItem
} from '../services/verification';
import Dropdown from './Dropdown';
import './VerificationRequest.css';

const VerificationRequest: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationRequests, setVerificationRequests] = useState<VerificationSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('page_size') || '10'),
  });
  
  const [filters, setFilters] = useState({
    type: (searchParams.get('type') as 'vendor' | 'courier' | 'both') || 'both',
    status: (searchParams.get('status') as 'pending' | 'approved' | 'rejected') || 'pending',
    search: searchParams.get('search') || '',
  });

  // Fetch verification requests when filters or pagination changes
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setLoading(true);
        console.log('Fetching verifications with filters:', { 
          type: filters.type, 
          status: filters.status,
          search: filters.search,
          page: pagination.page,
          pageSize: pagination.pageSize
        });
        
        const data = await getVerificationSummary(
          filters.type as 'vendor' | 'courier' | 'both',
          filters.status as 'pending' | 'approved' | 'rejected',
          filters.search,
          pagination.page,
          pagination.pageSize
        );

        console.log('API Response:', data);
        
        // Function to map API response to VerificationSummaryItem
        const mapToSummaryItem = (item: any, type: 'vendor' | 'courier'): VerificationSummaryItem => ({
          id: item.id || Math.floor(Math.random() * 1000000), // Generate a temporary ID if not present
          role: type,
          full_name: item.full_name || 'Unknown',
          phone_number: item.phone || null,
          package_type: item.package_type || null,
          date: item.date || new Date().toISOString(),
          address: item.address || null,
          profile_photo: item.profile_photo || null,
          id_image: item.id_document || null,
          cac_document: item.cac_document || null,
          nin_number: null, // Not in the API response, set as null
          verification_status: filters.status || 'pending'
        });

        // Process results based on selected type
        let results: VerificationSummaryItem[] = [];
        let totalCount = 0;
        let currentPage = 1;
        let totalPages = 1;

        if (filters.type === 'both') {
          const vendorResults = (data.vendors?.results || []).map((item: any) => 
            mapToSummaryItem(item, 'vendor')
          );
          const courierResults = (data.couriers?.results || []).map((item: any) => 
            mapToSummaryItem(item, 'courier')
          );
          
          results = [...vendorResults, ...courierResults];
          totalCount = (data.vendors?.count || 0) + (data.couriers?.count || 0);
          currentPage = data.vendors?.current_page || data.couriers?.current_page || 1;
          totalPages = Math.max(
            data.vendors?.num_pages || 0,
            data.couriers?.num_pages || 0
          );
        } else if (filters.type === 'vendor') {
          results = (data.vendors?.results || []).map((item: any) => 
            mapToSummaryItem(item, 'vendor')
          );
          totalCount = data.vendors?.count || 0;
          currentPage = data.vendors?.current_page || 1;
          totalPages = data.vendors?.num_pages || 1;
        } else if (filters.type === 'courier') {
          results = (data.couriers?.results || []).map((item: any) => 
            mapToSummaryItem(item, 'courier')
          );
          totalCount = data.couriers?.count || 0;
          currentPage = data.couriers?.current_page || 1;
          totalPages = data.couriers?.num_pages || 1;
        }

        console.log('Mapped results:', results);
        
        setVerificationRequests(results);
        setPagination(prev => ({
          ...prev,
          count: totalCount,
          page: currentPage,
          next: currentPage < totalPages ? 'true' : null,
          previous: currentPage > 1 ? 'true' : null,
        }));
        setError(null);
        console.log('State updated with results. Count:', results.length);
      } catch (err) {
        console.error('Error fetching verifications:', err);
        setError('Failed to load verification requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Update URL with current filters and pagination
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      page_size: pagination.pageSize.toString(),
      type: filters.type,
      status: filters.status,
      ...(filters.search && { search: filters.search }),
    });
    setSearchParams(params);

    fetchVerifications();
  }, [filters, pagination.page, pagination.pageSize, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (request: VerificationSummaryItem) => {
    if (request.id) {
      navigate(`/verification-requests/${request.id}`, { state: { role: request.role } });
    }
  };

  const handleRowDoubleClick = (item: VerificationSummaryItem) => {
    handleViewDetails(item);
  };

  if (loading && verificationRequests.length === 0) {
    return (
      <div className="verification-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading verification requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verification-page">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const data = await getVerificationSummary(
        filters.type as 'vendor' | 'courier' | 'both',
        filters.status as 'pending' | 'approved' | 'rejected',
        filters.search,
        pagination.page,
        pagination.pageSize
      );

      const mapToSummaryItem = (item: any, type: 'vendor' | 'courier'): VerificationSummaryItem => ({
        id: item.id || Math.floor(Math.random() * 1000000),
        role: type,
        full_name: item.full_name || 'Unknown',
        phone_number: item.phone || null,
        package_type: item.package_type || null,
        date: item.date || new Date().toISOString(),
        address: item.address || null,
        profile_photo: item.profile_photo || null,
        id_image: item.id_document || null,
        cac_document: item.cac_document || null,
        nin_number: null,
        verification_status: item.verification_status || filters.status || 'pending'
      });

      let results: VerificationSummaryItem[] = [];
      let totalCount = 0;
      let currentPage = 1;
      let totalPages = 1;

      if (filters.type === 'both') {
        const vendorResults = (data.vendors?.results || []).map((item: any) => 
          mapToSummaryItem(item, 'vendor')
        );
        const courierResults = (data.couriers?.results || []).map((item: any) => 
          mapToSummaryItem(item, 'courier')
        );
        
        results = [...vendorResults, ...courierResults];
        totalCount = (data.vendors?.count || 0) + (data.couriers?.count || 0);
        currentPage = data.vendors?.current_page || data.couriers?.current_page || 1;
        totalPages = Math.max(
          data.vendors?.num_pages || 0,
          data.couriers?.num_pages || 0
        );
      } else if (filters.type === 'vendor') {
        results = (data.vendors?.results || []).map((item: any) => 
          mapToSummaryItem(item, 'vendor')
        );
        totalCount = data.vendors?.count || 0;
        currentPage = data.vendors?.current_page || 1;
        totalPages = data.vendors?.num_pages || 1;
      } else if (filters.type === 'courier') {
        results = (data.couriers?.results || []).map((item: any) => 
          mapToSummaryItem(item, 'courier')
        );
        totalCount = data.couriers?.count || 0;
        currentPage = data.couriers?.current_page || 1;
        totalPages = data.couriers?.num_pages || 1;
      }

      setVerificationRequests(results);
      setPagination(prev => ({
        ...prev,
        count: totalCount,
        page: currentPage,
        next: currentPage < totalPages ? 'true' : null,
        previous: currentPage > 1 ? 'true' : null,
      }));
      setError(null);
    } catch (err) {
      console.error('Error fetching verifications:', err);
      setError('Failed to load verification requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: VerificationSummaryItem) => {
    try {
      // Here you would typically make an API call to approve the request
      // For example: await approveVerificationRequest(request.id, 'vendor');
      console.log('Approving request:', request.id);
      
      // Refresh the verification requests after approval
      await fetchVerifications();
    } catch (error) {
      console.error('Error approving request:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const handleDecline = async (request: VerificationSummaryItem) => {
    try {
      // Here you would typically make an API call to reject the request
      // For example: await rejectVerificationRequest(request.id, 'vendor');
      console.log('Rejecting request:', request.id);
      
      // Refresh the verification requests after rejection
      await fetchVerifications();
    } catch (error) {
      console.error('Error rejecting request:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const getDropdownItems = (request: VerificationSummaryItem) => [
    {
      label: 'View Details',
      onClick: () => handleViewDetails(request)
    },
    {
      label: 'Approve Request',
      onClick: () => handleApprove(request)
    },
    {
      label: 'Reject Request',
      onClick: () => handleDecline(request),
      className: 'danger'
    },
    {
      label: 'Contact User',
      onClick: () => window.location.href = `tel:${request.phone_number || ''}`
    }
  ];

  const renderVerificationTable = () => (
    <div className="verification-page">
      {/* Rest of your existing JSX */}
      {/* Header and Filters */}
      <div className="verification-header">
        <h1>Verification Requests</h1>
        <div className="verification-filters">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="both">All Types</option>
            <option value="vendor">Vendors</option>
            <option value="courier">Couriers</option>
          </select>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search..."
            className="search-input"
          />
          
          <div className="search-group">
            <input
              type="text"
              name="search"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>
        </div>
      </div>
      
      {/* Verification Table */}
      <div className="verification-table-container">
        <table className="verification-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verificationRequests.length > 0 ? (
              verificationRequests.map((item) => (
                <tr 
                  key={item.id} 
                  className="verification-row"
                  onDoubleClick={() => handleRowDoubleClick(item)}
                >
                  <td>
                    <div className="user-info">
                      {item.profile_photo && (
                        <img 
                          src={item.profile_photo} 
                          alt={item.full_name} 
                          className="user-avatar"
                        />
                      )}
                      <div>
                        <div className="user-name">{item.full_name}</div>
                        {item.phone_number && <div className="user-email">{item.phone_number}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="user-type">
                    <span className={`type-badge ${item.role}`}>
                      {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${item.verification_status}`}>
                      {item.verification_status}
                    </span>
                  </td>
                  <td className="date">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="actions">
                    <Dropdown 
                      items={getDropdownItems(item)}
                      position="left"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="no-results">
                  No verification requests found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination.count > 0 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.page} of {Math.ceil(pagination.count / pagination.pageSize)}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={
              pagination.page >= Math.ceil(pagination.count / pagination.pageSize)
            }
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  // Main component render
  return (
    <div className="verification-request-container">
      {loading && verificationRequests.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading verification requests...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchVerifications} className="retry-button">
            Retry
          </button>
        </div>
      ) : (
        renderVerificationTable()
      )}
    </div>
  );
};

export default VerificationRequest;
