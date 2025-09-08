import { apiFetch } from '../utils/api';

// Types for revenue data
export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
  average_order_value: number;
}

export interface RevenueSummary {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  growth_percentage: number;
  previous_period_revenue: number;
}

export interface RevenueAnalyticsResponse {
  summary: RevenueSummary;
  time_series: RevenueDataPoint[];
  breakdown: {
    by_status: {
      completed: number;
      pending: number;
      cancelled: number;
    };
    by_payment_method: {
      card: number;
      bank_transfer: number;
    };
    top_vendors: Array<{
      id: number;
      business_name: string;
      revenue: number;
      orders: number;
      percentage: number;
    }>;
  };
  period: {
    start_date: string;
    end_date: string;
    granularity: string;
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface RevenueChartResponse {
  chart_type: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
  }>;
  options: any;
}

// Revenue service functions
export const getRevenueAnalytics = async (
  period: string = 'month',
  granularity: string = 'day',
  startDate?: string,
  endDate?: string
): Promise<RevenueAnalyticsResponse> => {
  const params = new URLSearchParams({
    period,
    granularity,
  });

  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await apiFetch(`/admin/revenue/analytics/?${params.toString()}`);
  return response;
};

export const getRevenueChartData = async (
  chartType: string = 'line',
  period: string = 'month',
  granularity: string = 'day'
): Promise<RevenueChartResponse> => {
  const params = new URLSearchParams({
    chart_type: chartType,
    period,
    granularity,
  });

  const response = await apiFetch(`/admin/revenue/chart/?${params.toString()}`);
  return response;
};

// Helper function to convert API data to chart format
export const convertToChartData = (timeSeries: RevenueDataPoint[]): ChartDataPoint[] => {
  return timeSeries.map(point => ({
    name: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    value: point.revenue
  }));
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return `N${amount.toLocaleString()}`;
};

// Helper function to format percentage
export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};
