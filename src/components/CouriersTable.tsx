import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import './CouriersTable.css';

interface Courier {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_image?: string;
  completed_deliveries: number;
  rating: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  joined_date: string;
}

const CouriersTable: React.FC = () => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('-joined_date');

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (verificationFilter !== 'all') params.append('verification_status', verificationFilter);
      if (activeFilter !== 'all') params.append('user__is_active', activeFilter === 'active' ? 'true' : 'false');
      if (sortField) params.append('ordering', sortField);

      const response = await apiFetch(`/api/user/couriers/?${params.toString()}`);
      setCouriers(response.results);
    } catch (err) {
      setError('Failed to fetch couriers. Please try again.');
      console.error('Error fetching couriers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, [searchTerm, verificationFilter, activeFilter, sortField]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCouriers();
  };

  const handleSort = (field: string) => {
    const isDesc = sortField.startsWith('-' + field);
    const isAsc = sortField === field;
    
    if (isDesc) {
      setSortField(field); // Change to ascending
    } else if (isAsc) {
      setSortField('-' + field); // Change to descending
    } else {
      setSortField('-' + field); // Default to descending
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortField === field) return ' ↑';
    if (sortField === '-' + field) return ' ↓';
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && couriers.length === 0) {
    return <div className="loading">Loading couriers...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="couriers-container">
      <div className="filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search couriers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="filter-group">
          <label>Verification:</label>
          <select 
            value={verificationFilter} 
            onChange={(e) => setVerificationFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={activeFilter} 
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="couriers-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                Name {getSortIndicator('name')}
              </th>
              <th>Contact</th>
              <th onClick={() => handleSort('completed_deliveries')}>
                Deliveries {getSortIndicator('completed_deliveries')}
              </th>
              <th onClick={() => handleSort('rating')}>
                Rating {getSortIndicator('rating')}
              </th>
              <th onClick={() => handleSort('verification_status')}>
                Status {getSortIndicator('verification_status')}
              </th>
              <th onClick={() => handleSort('joined_date')}>
                Joined {getSortIndicator('joined_date')}
              </th>
            </tr>
          </thead>
          <tbody>
            {couriers.length > 0 ? (
              couriers.map((courier) => (
                <tr key={courier.id}>
                  <td className="user-cell">
                    {courier.profile_image ? (
                      <img 
                        src={courier.profile_image} 
                        alt={courier.name}
                        className="user-avatar"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {courier.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{courier.name}</span>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div>{courier.email}</div>
                      <div>{courier.phone}</div>
                    </div>
                  </td>
                  <td>{courier.completed_deliveries}</td>
                  <td>
                    <div className="rating">
                      <span className="stars">
                        {'★'.repeat(Math.round(courier.rating))}
                        {'☆'.repeat(5 - Math.round(courier.rating))}
                      </span>
                      <span className="rating-value">{courier.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${courier.verification_status} ${!courier.is_active ? 'inactive' : ''}`}>
                      {courier.verification_status}
                      {!courier.is_active && ' (Inactive)'}
                    </span>
                  </td>
                  <td>{formatDate(courier.joined_date)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-data">
                  No couriers found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouriersTable;
