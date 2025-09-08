import { apiFetch } from '../utils/api';

// Types for Order Activity API
export interface OrderActivityChartData {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface OrderActivityResponse {
  period: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  total_orders: number;
  chart_data: OrderActivityChartData[];
  summary: {
    completed: number;
    pending: number;
    rejected: number;
    completion_rate: number;
  };
}

// Types for Top Vendors API
export interface TopVendor {
  vendor_id: number;
  business_name: string;
  top_item: string;
  orders: number;
  change_percentage: number;
  trend: 'up' | 'down';
  change_color: string;
}

export interface TopVendorsResponse {
  period: string;
  date_range: {
    current_start: string;
    current_end: string;
    previous_start: string;
    previous_end: string;
  };
  top_vendors: TopVendor[];
  summary: {
    total_vendors: number;
    total_orders: number;
  };
}

/**
 * Get order activity data for donut chart
 */
export const getOrderActivity = async (period: string = 'week'): Promise<OrderActivityResponse> => {
  try {
    const response = await apiFetch(`/admin/dashboard/order-activity/?period=${period}`);
    return response;
  } catch (error) {
    console.error('Error fetching order activity:', error);
    throw error;
  }
};

/**
 * Get top vendors data
 */
export const getTopVendors = async (period: string = 'week'): Promise<TopVendorsResponse> => {
  try {
    const response = await apiFetch(`/admin/dashboard/top-vendors/?period=${period}`);
    return response;
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    throw error;
  }
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Get trend icon based on trend direction
 */
export const getTrendIcon = (trend: 'up' | 'down') => {
  return trend === 'up' ? '↗' : '↘';
};
