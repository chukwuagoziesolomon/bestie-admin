import React, { useState, useEffect } from 'react';
import { Package, Users, Store, Truck, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { getDashboardStats, getTrendIcon, getTrendColorClass } from '../services/dashboardStats';
import './StatsCards.css';

interface MetricData {
  value: number;
  percentage_change?: number;
  trend?: 'up' | 'down';
  description?: string;
}

interface DashboardMetrics {
  users: {
    total: number;
    new: number;
    active: number;
  };
  couriers: {
    total: number;
    verified: number;
    pending: number;
  };
  vendors: {
    total: number;
    verified: number;
    pending: number;
  };
  orders: {
    total: number;
    recent: number;
  };
  date_range: {
    start: string;
    end: string;
  };
}

interface TrendData {
  value: string;
  isPositive: boolean;
  description: string;
  period?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: TrendData;
  iconColor: string;
  subtitle?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  iconColor, 
  subtitle, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="stat-card loading">
        <div className="stat-card-content">
          <div className="stat-card-info">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-value"></div>
            {subtitle && <div className="skeleton skeleton-trend" style={{ width: '80%' }}></div>}
          </div>
          <div className="stat-card-icon" style={{ backgroundColor: '#f3f4f6' }}>
            <div className="skeleton" style={{ width: '24px', height: '24px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-info">
          <h3 className="stat-card-title">{title}</h3>
          <div className="stat-card-value">{value}</div>
          {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
          {trend?.value !== '--' && (
            <div className="stat-card-trend">
              {trend?.value !== '--' && (
                <>
                  <span className={`trend-icon ${trend?.isPositive ? 'positive' : 'negative'}`}>
                    {trend?.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </span>
                  <span className={`trend-value ${trend?.isPositive ? 'positive' : 'negative'}`}>
                    {trend?.value}
                  </span>
                </>
              )}
              <span className="trend-period">
                {trend?.description || (trend?.isPositive ? 'Up' : 'Down')} {trend?.period ? `this ${trend.period}` : ''}
              </span>
            </div>
          )}
        </div>
        <div className={`stat-card-icon ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const StatsCards: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      console.log('Starting to fetch dashboard stats...');
      try {
        setLoading(true);
        setError(null);
        
        const data = await getDashboardStats('week');
        console.log('Dashboard stats received:', data);
        
        if (!data) {
          throw new Error('No data received from server');
        }
        
        setStats(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard stats';
        console.error('Error in fetchStats:', err);
        setError(errorMessage);
        
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

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card loading">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-value"></div>
            <div className="skeleton skeleton-trend"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return <div className="error-message">{error || 'No data available'}</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(value);
  };

  const statsData = stats ? [
    {
      title: 'Total Order',
      value: stats.total_orders.value.toString(),
      icon: <Package size={24} />,
      trend: {
        value: `${stats.total_orders.change_percentage}%`,
        isPositive: stats.total_orders.trend === 'up',
        description: stats.total_orders.comparison_text,
        period: ''
      },
      iconColor: 'blue',
      loading: loading,
      subtitle: ''
    },
    {
      title: 'Total Revenue',
      value: stats.total_revenue.formatted_value,
      icon: <TrendingUp size={24} />,
      trend: {
        value: `${stats.total_revenue.change_percentage}%`,
        isPositive: stats.total_revenue.trend === 'up',
        description: stats.total_revenue.comparison_text,
        period: ''
      },
      iconColor: 'green',
      loading: loading,
      subtitle: ''
    },
    {
      title: 'Pending Verification',
      value: stats.pending_verification.value.toString(),
      icon: <CheckCircle size={24} />,
      trend: {
        value: `${stats.pending_verification.change_percentage}%`,
        isPositive: stats.pending_verification.trend === 'up',
        description: stats.pending_verification.comparison_text,
        period: ''
      },
      iconColor: 'orange',
      loading: loading,
      subtitle: ''
    },
    {
      title: 'Active Couriers',
      value: stats.active_couriers.value.toString(),
      icon: <Truck size={24} />,
      trend: {
        value: `${stats.active_couriers.change_percentage}%`,
        isPositive: stats.active_couriers.trend === 'up',
        description: stats.active_couriers.comparison_text,
        period: ''
      },
      iconColor: 'purple',
      loading: loading,
      subtitle: ''
    }
  ] : [];

  return (
    <div className="stats-grid">
      {statsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsCards;
