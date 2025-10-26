import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Package, DollarSign, Clock, Users } from 'lucide-react';
import RevenueChart from './RevenueChart';
import RecentActivities from './RecentActivities';
import OrderActivityDonutChart from './OrderActivityDonutChart';
import TopVendors from './TopVendors';
import { getDashboardStats } from '../services/dashboardStats';
import './Analytics.css';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getDashboardStats('week');
        setStats(data);
      } catch (err) {
        console.error('Error fetching analytics stats:', err);
        setError('Failed to load analytics data');

        // Fall back to hardcoded data if API fails
        setStats({
          total_orders: { value: 90, trend: 'up', change_percentage: 1.3, comparison_text: 'Up from past week', icon: 'package' },
          total_revenue: { value: 200000, formatted_value: 'N200,000', trend: 'down', change_percentage: 4.3, comparison_text: 'Down from yesterday', icon: 'trending-up' },
          pending_verification: { value: 10, trend: 'up', change_percentage: 1.8, comparison_text: 'Up from yesterday', icon: 'check-circle' },
          active_couriers: { value: 8, trend: 'up', change_percentage: 1.8, comparison_text: 'Up from yesterday', icon: 'truck' }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const metrics = stats ? [
    {
      title: 'Total Order',
      value: stats.total_orders.value.toString(),
      change: `${stats.total_orders.change_percentage}% ${stats.total_orders.comparison_text}`,
      trend: stats.total_orders.trend,
      icon: Package,
      color: 'teal'
    },
    {
      title: 'Total Revenue',
      value: stats.total_revenue.formatted_value,
      change: `${stats.total_revenue.change_percentage}% ${stats.total_revenue.comparison_text}`,
      trend: stats.total_revenue.trend,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Pending Verification',
      value: stats.pending_verification.value.toString(),
      change: `${stats.pending_verification.change_percentage}% ${stats.pending_verification.comparison_text}`,
      trend: stats.pending_verification.trend,
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Active Couriers',
      value: stats.active_couriers.value.toString(),
      change: `${stats.active_couriers.change_percentage}% ${stats.active_couriers.comparison_text}`,
      trend: stats.active_couriers.trend,
      icon: Users,
      color: 'cyan'
    }
  ] : [];



  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h1 className="analytics-title">Analytics</h1>
        </div>
        <div className="metrics-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="metric-card loading">
              <div className="metric-header">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-icon"></div>
              </div>
              <div className="skeleton skeleton-value"></div>
              <div className="skeleton skeleton-change"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h1 className="analytics-title">Analytics</h1>
        </div>
        <div className="error-message">
          {error || 'No analytics data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <span className="metric-title">{metric.title}</span>
              <div className={`metric-icon ${metric.color}`}>
                <metric.icon size={20} />
              </div>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className={`metric-change ${metric.trend}`}>
              {metric.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {metric.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="analytics-content">
        {/* Revenue Details */}
        <div className="revenue-section">
          <RevenueChart />
        </div>

        {/* Recent Activities */}
        <div className="activities-section">
          <RecentActivities />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Top Vendors */}
        <TopVendors />

        {/* Order Activity */}
        <OrderActivityDonutChart />
      </div>
    </div>
  );
};

export default Analytics;
