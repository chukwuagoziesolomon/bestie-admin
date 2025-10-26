import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, Filter } from 'lucide-react';
import { getProfitSummary, getProfitDetailed, ProfitSummary, ProfitDetail } from '../services/analytics';
import './ProfitAnalytics.css';

const ProfitAnalytics: React.FC = () => {
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [profitDetails, setProfitDetails] = useState<ProfitDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch profit data
  useEffect(() => {
    const fetchProfitData = async () => {
      try {
        setLoading(true);
        setError(null);

        const summaryData = await getProfitSummary({ period });
        setProfitSummary(summaryData);

        const detailedData = await getProfitDetailed({ page: currentPage, page_size: 10 });
        setProfitDetails(detailedData.results);
        setTotalPages(detailedData.num_pages);
      } catch (err) {
        console.error('Error fetching profit data:', err);
        setError('Failed to load profit analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfitData();
  }, [period, currentPage]);

  const formatCurrency = (amount: string) => {
    return `N${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profit-analytics">
        <div className="profit-header">
          <h2 className="profit-title">Profit Analytics</h2>
        </div>
        <div className="profit-loading">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-table"></div>
        </div>
      </div>
    );
  }

  if (error || !profitSummary) {
    return (
      <div className="profit-analytics">
        <div className="profit-header">
          <h2 className="profit-title">Profit Analytics</h2>
        </div>
        <div className="error-message">
          {error || 'No profit data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="profit-analytics">
      {/* Header */}
      <div className="profit-header">
        <h2 className="profit-title">Profit Analytics</h2>
        <div className="profit-filters">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="period-select"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="profit-summary-grid">
        <div className="profit-card">
          <div className="profit-card-header">
            <span className="profit-card-title">Total Profit</span>
            <DollarSign className="profit-card-icon green" size={20} />
          </div>
          <div className="profit-card-value">{formatCurrency(profitSummary.total_profit)}</div>
          <div className="profit-card-subtitle">
            From {profitSummary.total_orders} completed orders
          </div>
        </div>

        <div className="profit-card">
          <div className="profit-card-header">
            <span className="profit-card-title">Profit Margin</span>
            <BarChart3 className="profit-card-icon blue" size={20} />
          </div>
          <div className="profit-card-value">{profitSummary.profit_margin_percentage}%</div>
          <div className="profit-card-subtitle">
            Avg: {formatCurrency(profitSummary.average_profit_per_order)} per order
          </div>
        </div>

        <div className="profit-card">
          <div className="profit-card-header">
            <span className="profit-card-title">Commission Revenue</span>
            <TrendingUp className="profit-card-icon teal" size={20} />
          </div>
          <div className="profit-card-value">{formatCurrency(profitSummary.breakdown.commission_revenue)}</div>
          <div className="profit-card-subtitle">
            Platform commission earnings
          </div>
        </div>

        <div className="profit-card">
          <div className="profit-card-header">
            <span className="profit-card-title">Delivery Fees</span>
            <TrendingDown className="profit-card-icon orange" size={20} />
          </div>
          <div className="profit-card-value">{formatCurrency(profitSummary.breakdown.delivery_fees)}</div>
          <div className="profit-card-subtitle">
            Delivery service revenue
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart Placeholder */}
      <div className="profit-trend-section">
        <h3 className="trend-title">Monthly Profit Trend</h3>
        <div className="trend-chart">
          {profitSummary.monthly_trend && profitSummary.monthly_trend.length > 0 ? (
            profitSummary.monthly_trend.map((month, index) => (
              <div key={month.month} className="trend-bar">
                <div className="trend-bar-fill" style={{ height: `${(parseFloat(month.profit) / 1000) * 100}%` }}></div>
                <div className="trend-bar-label">{month.month.split('-')[1]}</div>
                <div className="trend-bar-value">{formatCurrency(month.profit)}</div>
              </div>
            ))
          ) : (
            <div className="no-data">No trend data available</div>
          )}
        </div>
      </div>

      {/* Detailed Profit Table */}
      <div className="profit-details-section">
        <h3 className="details-title">Profit Breakdown by Order</h3>
        <div className="profit-table-container">
          <table className="profit-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Completed Date</th>
                <th>Order Total</th>
                <th>Commission</th>
                <th>Delivery Fee</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {profitDetails && profitDetails.length > 0 ? (
                profitDetails.map((detail) => (
                  <tr key={detail.order_id}>
                    <td className="order-number">{detail.order_number}</td>
                    <td>{formatDate(detail.completed_at)}</td>
                    <td>{formatCurrency(detail.total_price)}</td>
                    <td>{formatCurrency(detail.platform_commission)}</td>
                    <td>{formatCurrency(detail.delivery_fee)}</td>
                    <td className="profit-amount">{formatCurrency(detail.profit)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-data">No profit details available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitAnalytics;