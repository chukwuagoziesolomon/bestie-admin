import { apiFetch } from '../utils/api';

// Types for suspended users
export interface SuspendedVendor {
  id: number;
  email: string;
  business_name: string;
  suspension_reason: string;
  suspension_date: string;
  suspension_duration_days: number | null;
}

export interface SuspendedCourier {
  id: number;
  email: string;
  full_name: string;
  suspension_reason: string;
  suspension_date: string;
  suspension_duration_days: number | null;
}

export interface SuspendedVendorsResponse {
  count: number;
  results: SuspendedVendor[];
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SuspendedCouriersResponse {
  count: number;
  results: SuspendedCourier[];
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SuspendedUsersResponse {
  suspended_vendors: SuspendedVendorsResponse;
  suspended_couriers: SuspendedCouriersResponse;
}

export interface SuspendedUsersParams {
  type?: 'vendor' | 'courier';
  page?: number;
  page_size?: number;
  search?: string;
}

// Get suspended users
export const getSuspendedUsers = async (params: SuspendedUsersParams = {}): Promise<SuspendedUsersResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.type) queryParams.append('type', params.type);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.page_size) queryParams.append('page_size', params.page_size.toString());
  if (params.search) queryParams.append('search', params.search);
  
  const queryString = queryParams.toString();
  const url = `/admin/users/suspended/${queryString ? `?${queryString}` : ''}`;
  
  return await apiFetch(url);
};

// Reactivate suspended user (vendor)
export const reactivateVendor = async (vendorId: number, reason: string): Promise<any> => {
  console.log('=== REACTIVATE VENDOR SERVICE ===');
  console.log('Vendor ID:', vendorId);
  console.log('Reason:', reason);
  console.log('Endpoint:', `/admin/users/vendor/${vendorId}/activate/`);
  
  const response = await apiFetch(`/admin/users/vendor/${vendorId}/activate/`, {
    method: 'POST',
    body: JSON.stringify({
      reason,
      notify_user: true
    })
  });
  
  console.log('Vendor reactivation response:', response);
  return response;
};

// Reactivate suspended user (courier)
export const reactivateCourier = async (courierId: number, reason: string): Promise<any> => {
  return await apiFetch(`/admin/users/courier/${courierId}/activate/`, {
    method: 'POST',
    body: JSON.stringify({
      reason,
      notify_user: true
    })
  });
};
