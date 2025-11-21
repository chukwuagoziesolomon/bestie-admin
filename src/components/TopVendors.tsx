import React, { useState, useEffect } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { getTopVendors, TopVendorsResponse, formatPercentage } from '../services/analytics';
import './TopVendors.css';

interface TopVendorsProps {
  className?: string;
}

const TopVendors: React.FC<TopVendorsProps> = ({ className = '' }) => {
  const [data, setData] = useState<TopVendorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('week');
  const [showDropdown, setShowDropdown] = useState(false);

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const fetchData = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTopVendors(selectedPeriod);
      setData(response);
    } catch (err) {
      console.error('Error fetching top vendors:', err);
      setError('Failed to load top vendors data');
      
      // Fallback to hardcoded data
      setData({
        period: selectedPeriod,
        date_range: {
          current_start: new Date().toISOString(),
          current_end: new Date().toISOString(),
          previous_start: new Date().toISOString(),
          previous_end: new Date().toISOString()
        },
        top_vendors: [
          {
            vendor_id: 1,
            business_name: 'Mr Biggs',
            top_item: 'Jollof rice',
            orders: 65,
            change_percentage: 12.0,
            trend: 'up',
            change_color: '#10B981'
          },
          {
            vendor_id: 2,
            business_name: 'Grilled Chicken Wrap',
            top_item: 'Jollof rice',
            orders: 30,
            change_percentage: 24.0,
            trend: 'up',
            change_color: '#10B981'
          },
          {
            vendor_id: 3,
            business_name: 'Mr Biggs',
            top_item: 'Jollof rice',
            orders: 30,
            change_percentage: -32.0,
            trend: 'down',
            change_color: '#EF4444'
          }
        ],
        summary: {
          total_vendors: 3,
          total_orders: 125
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setShowDropdown(false);
  };

  const getCurrentPeriodLabel = () => {
    return periods.find(p => p.value === period)?.label || 'This Week';
  };

  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
  };

  if (loading) {
    return (
      <div className={`vendors-section ${className}`}>
        <div className="section-header">
          <h2>Top Vendors</h2>
          <div className="filter-button loading">
            <div className="skeleton skeleton-text"></div>
          </div>
        </div>
        <div className="vendors-list loading">
          {[1, 2, 3].map(i => (
            <div key={i} className="vendor-item-skeleton">
              <div className="vendor-info-skeleton">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-description"></div>
              </div>
              <div className="vendor-chart-skeleton">
                <div className="skeleton skeleton-chart"></div>
              </div>
              <div className="vendor-stats-skeleton">
                <div className="skeleton skeleton-orders"></div>
                <div className="skeleton skeleton-change"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`vendors-section ${className}`}>
        <div className="section-header">
          <h2>Top Vendors</h2>
          <button className="filter-button">
            {getCurrentPeriodLabel()}
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="error-message">
          {error || 'No top vendors data available'}
        </div>
      </div>
    );
  }

  return (
    <div className={`vendors-section ${className}`}>
      <div className="section-header">
        <h2>Top Vendors</h2>
        <div className="filter-dropdown">
          <button 
            className="filter-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {getCurrentPeriodLabel()}
            <ChevronDown size={16} />
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              {periods.map((p) => (
                <button
                  key={p.value}
                  className={`dropdown-item ${period === p.value ? 'active' : ''}`}
                  onClick={() => handlePeriodChange(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="vendors-list">
        {data.top_vendors?.map((vendor, index) => (
          <div key={vendor.vendor_id} className="vendor-item">
            <div className="vendor-info">
              <div className="vendor-name">{vendor.business_name}</div>
              <div className="vendor-description">{vendor.top_item}</div>
            </div>
            <div className="vendor-chart">
              <div 
                className="mini-chart" 
                style={{ backgroundColor: vendor.change_color }}
              ></div>
            </div>
            <div className="vendor-stats">
              <div className="vendor-orders">{vendor.orders} Orders</div>
              <div 
                className={`vendor-change ${vendor.trend}`}
                style={{ color: vendor.change_color }}
              >
                {getTrendIcon(vendor.trend)}
                {formatPercentage(vendor.change_percentage)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {data.summary && (
        <div className="vendors-summary">
          <div className="summary-item">
            <span className="summary-label">Total Vendors:</span>
            <span className="summary-value">{data.summary.total_vendors}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Orders:</span>
            <span className="summary-value">{data.summary.total_orders}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopVendors;

