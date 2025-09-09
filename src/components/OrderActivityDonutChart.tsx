import React, { useState, useEffect } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { getOrderActivity, OrderActivityResponse } from '../services/analytics';
import './OrderActivityDonutChart.css';

interface OrderActivityDonutChartProps {
  className?: string;
}

const OrderActivityDonutChart: React.FC<OrderActivityDonutChartProps> = ({ className = '' }) => {
  const [data, setData] = useState<OrderActivityResponse | null>(null);
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
      const response = await getOrderActivity(selectedPeriod);
      setData(response);
    } catch (err) {
      console.error('Error fetching order activity:', err);
      setError('Failed to load order activity data');
      
      // Fallback to hardcoded data
      setData({
        period: selectedPeriod,
        date_range: {
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString()
        },
        total_orders: 145,
        chart_data: [
          {
            status: 'completed',
            label: 'Completed',
            count: 112,
            percentage: 77.2,
            color: '#10B981'
          },
          {
            status: 'rejected',
            label: 'Rejected',
            count: 10,
            percentage: 6.9,
            color: '#6B7280'
          },
          {
            status: 'pending',
            label: 'Pending',
            count: 15,
            percentage: 10.3,
            color: '#F59E0B'
          },
          {
            status: 'processing',
            label: 'Processing',
            count: 8,
            percentage: 5.5,
            color: '#3B82F6'
          }
        ],
        summary: {
          completed: 112,
          pending: 23,
          rejected: 10,
          completion_rate: 77.2
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

  const createDonutChart = () => {
    if (!data) return null;

    let cumulativePercentage = 0;
    const segments = data.chart_data.map((item, index) => {
      const startAngle = (cumulativePercentage / 100) * 360;
      const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
      cumulativePercentage += item.percentage;

      return {
        ...item,
        startAngle,
        endAngle,
        path: createArcPath(startAngle, endAngle, 60, 40) // outer radius 60, inner radius 40
      };
    });

    return segments;
  };

  const createArcPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    const start = polarToCartesian(100, 100, outerRadius, endAngle);
    const end = polarToCartesian(100, 100, outerRadius, startAngle);
    const innerStart = polarToCartesian(100, 100, innerRadius, endAngle);
    const innerEnd = polarToCartesian(100, 100, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", start.x, start.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  if (loading) {
    return (
      <div className={`order-activity-section ${className}`}>
        <div className="section-header">
          <h2>Order Activity</h2>
          <div className="filter-button loading">
            <div className="skeleton skeleton-text"></div>
          </div>
        </div>
        <div className="order-chart loading">
          <div className="donut-chart-skeleton"></div>
          <div className="chart-legend-skeleton">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="legend-item-skeleton">
                <div className="skeleton skeleton-color"></div>
                <div className="skeleton skeleton-text"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`order-activity-section ${className}`}>
        <div className="section-header">
          <h2>Order Activity</h2>
          <button className="filter-button">
            {getCurrentPeriodLabel()}
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="error-message">
          {error || 'No order activity data available'}
        </div>
      </div>
    );
  }

  const chartSegments = createDonutChart();

  return (
    <div className={`order-activity-section ${className}`}>
      <div className="section-header">
        <h2>Order Activity</h2>
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
      
      <div className="order-chart">
        <div className="donut-chart">
          <svg viewBox="0 0 200 200" className="chart-svg">
            {chartSegments?.map((segment, index) => (
              <path
                key={index}
                d={segment.path}
                fill={segment.color}
                className="chart-segment"
              />
            ))}
          </svg>
          <div className="chart-center">
            <div className="total-orders">{data.total_orders}</div>
            <div className="total-label">Total Orders</div>
            <div className="completion-rate">
              {data.summary.completion_rate.toFixed(1)}% Complete
            </div>
          </div>
        </div>
        
        <div className="chart-legend">
          {data.chart_data.map((item, index) => (
            <div key={index} className="legend-item">
              <span 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              ></span>
              <div className="legend-content">
                <span className="legend-label">{item.label}</span>
                <span className="legend-count">{item.count}</span>
              </div>
              <span className="legend-percentage">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderActivityDonutChart;

