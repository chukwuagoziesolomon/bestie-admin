import { apiFetch } from '../utils/api';

// Types for API requests and responses
export interface SuspendRequest {
  reason: string;
  duration_days?: number | null;
  notify_user?: boolean;
}

export interface ActivateRequest {
  reason: string;
  notify_user?: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  status: 'active' | 'suspended';
  suspension_reason?: string;
  suspension_date?: string;
  suspension_duration_days?: number | null;
  activation_date?: string;
}

export interface VendorResponse extends UserResponse {
  business_name: string;
}

export interface CourierResponse extends UserResponse {
  full_name: string;
}

export interface SuspendResponse {
  success: boolean;
  message: string;
  user: UserResponse | VendorResponse | CourierResponse;
}

export interface ActivateResponse {
  success: boolean;
  message: string;
  user: UserResponse | VendorResponse | CourierResponse;
}

// Suspend Vendor
export const suspendVendor = async (vendorId: number, data: SuspendRequest): Promise<SuspendResponse> => {
  return await apiFetch(`/admin/users/vendor/${vendorId}/suspend/`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Suspend Courier
export const suspendCourier = async (courierId: number, data: SuspendRequest): Promise<SuspendResponse> => {
  return await apiFetch(`/admin/users/courier/${courierId}/suspend/`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Activate Vendor
export const activateVendor = async (vendorId: number, data: ActivateRequest): Promise<ActivateResponse> => {
  return await apiFetch(`/admin/users/vendor/${vendorId}/activate/`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Activate Courier
export const activateCourier = async (courierId: number, data: ActivateRequest): Promise<ActivateResponse> => {
  return await apiFetch(`/admin/users/courier/${courierId}/activate/`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Suspend User (using the existing user endpoint with enhanced data)
export const suspendUser = async (userId: number, data: SuspendRequest): Promise<SuspendResponse> => {
  return await apiFetch(`/admin/users/${userId}/suspend/`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Activate User (using the existing user endpoint with enhanced data)
export const activateUser = async (userId: number, data: ActivateRequest): Promise<ActivateResponse> => {
  return await apiFetch(`/admin/users/${userId}/activate/`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Fallback: If the above endpoints don't exist, use the existing toggleUserStatus
// This will be used as a fallback in the Users component
export { toggleUserStatus } from './user';
