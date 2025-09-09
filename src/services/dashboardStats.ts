import { apiFetch } from '../utils/api';

// Types for dashboard stats
export interface StatItem {
  value: number;
  trend: 'up' | 'down';
  change_percentage: number;
  comparison_text: string;
  icon: string;
}

export interface RevenueStatItem extends StatItem {
  formatted_value: string;
}

export interface DashboardStatsResponse {
  total_orders: StatItem;
  total_revenue: RevenueStatItem;
  pending_verification: StatItem;
  active_couriers: StatItem;
}

// Types for revenue breakdown
export interface BreakdownItem {
  time: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface TopPerformer {
  vendor_id: number;
  vendor_name: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface RevenueBreakdownResponse {
  period: {
    date: string;
    period_type: string;
    breakdown_type: string;
  };
  summary: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
  };
  breakdown: BreakdownItem[];
  top_performers: TopPerformer[];
}

// Dashboard stats service functions
export const getDashboardStats = async (
  period: string = 'week'
): Promise<DashboardStatsResponse> => {
  const params = new URLSearchParams({
    period,
  });

  const response = await apiFetch(`/admin/dashboard/stats/?${params.toString()}`);
  return response;
};

export const getRevenueBreakdown = async (
  date?: string,
  period: string = 'day',
  breakdownType: string = 'hourly'
): Promise<RevenueBreakdownResponse> => {
  const params = new URLSearchParams({
    period,
    breakdown_type: breakdownType,
  });

  if (date) {
    params.append('date', date);
  }

  const response = await apiFetch(`/admin/revenue/breakdown/?${params.toString()}`);
  return response;
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

// Helper function to get trend icon
export const getTrendIcon = (trend: 'up' | 'down'): string => {
  return trend === 'up' ? '↗' : '↘';
};

// Helper function to get trend color class
export const getTrendColorClass = (trend: 'up' | 'down'): string => {
  return trend === 'up' ? 'up' : 'down';
};

