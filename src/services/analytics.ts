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
    
    // Check if response has the expected format
    if (response.chart_data) {
      return response;
    }
    
    // If response has orders array instead, transform it
    if (response.orders && Array.isArray(response.orders)) {
      const orders = response.orders;
      const totalOrders = response.total_count || orders.length;
      
      // Count orders by status
      const statusCounts: { [key: string]: number } = {};
      orders.forEach((order: any) => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      // Define status colors and labels
      const statusConfig: { [key: string]: { label: string; color: string } } = {
        delivered: { label: 'Delivered', color: '#10B981' },
        completed: { label: 'Completed', color: '#10B981' },
        cancelled: { label: 'Cancelled', color: '#EF4444' },
        rejected: { label: 'Rejected', color: '#6B7280' },
        pending: { label: 'Pending', color: '#F59E0B' },
        processing: { label: 'Processing', color: '#3B82F6' },
        ready: { label: 'Ready', color: '#8B5CF6' },
        confirmed: { label: 'Confirmed', color: '#06B6D4' },
      };
      
      // Create chart data
      const chart_data: OrderActivityChartData[] = Object.entries(statusCounts).map(([status, count]) => {
        const config = statusConfig[status] || { label: status, color: '#6B7280' };
        return {
          status,
          label: config.label,
          count,
          percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
          color: config.color,
        };
      });
      
      // Calculate summary
      const completed = (statusCounts.completed || 0) + (statusCounts.delivered || 0);
      const pending = (statusCounts.pending || 0) + (statusCounts.processing || 0) + (statusCounts.ready || 0) + (statusCounts.confirmed || 0);
      const rejected = (statusCounts.rejected || 0) + (statusCounts.cancelled || 0);
      const completion_rate = totalOrders > 0 ? (completed / totalOrders) * 100 : 0;
      
      // Transform to expected format
      return {
        period: response.period || period,
        date_range: {
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
        },
        total_orders: totalOrders,
        chart_data,
        summary: {
          completed,
          pending,
          rejected,
          completion_rate,
        },
      };
    }
    
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

// Types for Profit Analytics API
export interface ProfitSummary {
  total_profit: string;
  total_revenue: string;
  total_orders: number;
  average_profit_per_order: string;
  profit_margin_percentage: string;
  period: {
    start_date: string;
    end_date: string;
  };
  breakdown: {
    commission_revenue: string;
    delivery_fees: string;
    other_revenue: string;
  };
  monthly_trend: {
    month: string;
    profit: string;
    orders: number;
  }[];
}

export interface ProfitDetail {
  order_id: number;
  order_number: string;
  completed_at: string;
  total_price: string;
  platform_commission: string;
  delivery_fee: string;
  vendor_payout: string;
  courier_payout: string;
  profit: string;
}

export interface ProfitDetailedResponse {
  count: number;
  num_pages: number;
  current_page: number;
  results: ProfitDetail[];
  summary: {
    total_profit: string;
    total_revenue: string;
    date_range: {
      start_date: string;
      end_date: string;
    };
  };
}

/**
 * Get profit summary data
 */
export const getProfitSummary = async (params?: { period?: string; start_date?: string; end_date?: string }): Promise<ProfitSummary> => {
  try {
    let query = '/user/admin/profit/';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      query += '?' + queryParams.toString();
    }
    const response = await apiFetch(query);
    return response;
  } catch (error) {
    console.error('Error fetching profit summary:', error);
    throw error;
  }
};

/**
 * Get detailed profit breakdown
 */
export const getProfitDetailed = async (params?: { start_date?: string; end_date?: string; page?: number; page_size?: number }): Promise<ProfitDetailedResponse> => {
  try {
    let query = '/user/admin/profit/detailed/';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size) queryParams.append('page_size', params.page_size.toString());
      query += '?' + queryParams.toString();
    }
    const response = await apiFetch(query);
    return response;
  } catch (error) {
    console.error('Error fetching profit detailed:', error);
    throw error;
  }
};

/**
 * Get trend icon based on trend direction
 */
export const getTrendIcon = (trend: 'up' | 'down') => {
  return trend === 'up' ? '↗' : '↘';
};

