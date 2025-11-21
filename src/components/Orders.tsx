import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Calendar, Filter, X, Loader2 } from 'lucide-react';
import './Orders.css';
import { apiFetch } from '../utils/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  status_display: string;
  total_amount: number;
  customer: Customer;
  vendor: Vendor;
  delivery_address: string;
  items: OrderItem[];
  item_count: number;
}

const ITEMS_PER_PAGE = 20;

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];


const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorId, setVendorId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortField, setSortField] = useState<string>('-created_at'); // Default: newest first
  
  // Statistics state
  const [stats, setStats] = useState<{
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    completed_orders: number;
    monthly_stats?: Array<{ month: string; count: number; revenue: number }>;
  } | null>(null);
  const [statsTimeframe, setStatsTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  
  // Mock data for testing (will be replaced by API call)
  const mockOrders: Order[] = [
    {
      id: '1',
      order_number: 'ORD-001',
      created_at: '2025-08-15T10:30:00Z',
      updated_at: '2025-08-15T10:30:00Z',
      status: 'completed',
      status_display: 'Completed',
      total_amount: 50000,
      customer: {
        id: 'cust-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '08012345678'
      },
      vendor: {
        id: 'vendor-1',
        name: "Mama's Kitchen"
      },
      delivery_address: '12, Lagos State',
      items: [
        { id: 'item-1', name: 'Jollof Rice', quantity: 2, price: 25000 },
        { id: 'item-2', name: 'Chicken', quantity: 2, price: 25000 }
      ],
      item_count: 2
    }
  ];
  const fetchOrders = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: ITEMS_PER_PAGE.toString(),
        ordering: sortField,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (vendorId) {
        params.append('vendor_id', vendorId);
      }

      if (startDate) {
        params.append('start_date', startDate);
      }

      if (endDate) {
        params.append('end_date', endDate);
      }

      const data = await apiFetch(`/api/admin/orders/?${params.toString()}`);
      
      setOrders(data.results || []);
      setTotalPages(Math.ceil(data.count / ITEMS_PER_PAGE) || 1);
      setTotalItems(data.count);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // fetchOrders will be triggered by the useEffect with the updated searchQuery
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchOrders(page);
    window.scrollTo(0, 0);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const newSortField = sortField === `-${field}` ? field : `-${field}`;
    setSortField(newSortField);
  };

  // Fetch order statistics
  const fetchOrderStats = async (timeframe: 'day' | 'week' | 'month' | 'year' = 'month') => {
    try {
      setStatsLoading(true);
      const data = await apiFetch(`/api/admin/orders/stats/?timeframe=${timeframe}`);
      setStats(data);
    } catch (err) {
      console.error('Error fetching order stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders(1);
    fetchOrderStats(statsTimeframe);
    // Reset to first page when filters change
  }, [statusFilter, vendorId, startDate, endDate, sortField, searchQuery, statsTimeframe]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'completed';
      case 'cancelled':
      case 'rejected':
        return 'rejected';
      case 'processing':
      case 'shipped':
        return 'processing';
      default:
        return 'pending';
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setVendorId('');
    setStartDate('');
    setEndDate('');
    setSortField('-created_at');
    // No need to call fetchOrders here as the useEffect will trigger it
  };

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== 'all' || vendorId || startDate || endDate;
  
  return (
    <div className="orders-page">
      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-header">
          <h2>Order Statistics</h2>
          <div className="stats-timeframe">
            <span>Timeframe: </span>
            <select 
              value={statsTimeframe}
              onChange={(e) => setStatsTimeframe(e.target.value as any)}
              disabled={statsLoading}
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
        
        {statsLoading ? (
          <div className="stats-loading">Loading statistics...</div>
        ) : stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total_orders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">₦{stats.total_revenue?.toLocaleString()}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.pending_orders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.completed_orders}</div>
              <div className="stat-label">Completed Orders</div>
            </div>
          </div>
        ) : (
          <div className="stats-error">Failed to load statistics</div>
        )}
      </div>

      {/* Header */}
      <div className="orders-header">
        <h1 className="orders-title">Order List</h1>
        <div className="orders-actions">
          <form onSubmit={handleSearch} className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Vendor ID</label>
            <input
              type="text"
              placeholder="Vendor ID"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group date-filter">
            <label>Start Date</label>
            <div className="date-input-container">
              <Calendar size={16} className="date-icon" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>

          <div className="filter-group date-filter">
            <label>End Date</label>
            <div className="date-input-container">
              <Calendar size={16} className="date-icon" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
                min={startDate}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="clear-filters">
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="orders-table-container">
        {loading && orders.length === 0 ? (
          <div className="loading-container">
            <Loader2 className="animate-spin" size={24} />
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
            <button onClick={() => fetchOrders(currentPage)} className="retry-button">
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-results">
            <p>No orders found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th 
                    className={sortField.includes('order_number') ? 'sort-active' : ''}
                    onClick={() => handleSort('order_number')}
                  >
                    Order # {sortField === 'order_number' ? '↑' : sortField === '-order_number' ? '↓' : ''}
                  </th>
                  <th>Customer</th>
                  <th>Vendor</th>
                  <th 
                    className={sortField.includes('created_at') ? 'sort-active' : ''}
                    onClick={() => handleSort('created_at')}
                  >
                    Date {sortField === 'created_at' ? '↑' : sortField === '-created_at' ? '↓' : ''}
                  </th>
                  <th>Items</th>
                  <th 
                    className={sortField.includes('total_amount') ? 'sort-active' : ''}
                    onClick={() => handleSort('total_amount')}
                  >
                    Total {sortField === 'total_amount' ? '↑' : sortField === '-total_amount' ? '↓' : ''}
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">#{order.order_number}</td>
                    <td className="order-customer">
                      <div className="customer-name">{order.customer?.name ?? 'N/A'}</div>
                      <div className="customer-email">{order.customer?.email ?? 'N/A'}</div>
                    </td>
                    <td className="order-vendor">
                      <div>{order.vendor?.name ?? 'N/A'}</div>
                      <div className="vendor-id">ID: {order.vendor?.id ?? 'N/A'}</div>
                    </td>
                    <td className="order-date">{formatDate(order.created_at)}</td>
                    <td className="order-items">{order.item_count}</td>
                    <td className="order-total">{formatCurrency(order.total_amount)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status_display || order.status}
                      </span>
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
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages} • {totalItems} total orders
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
