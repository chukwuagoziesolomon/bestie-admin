import { apiFetch, getAuthToken, removeAuthToken } from '../utils/api';

// Note: API base URL is now handled by apiFetch in utils/api.ts

// User interface for verification requests
export interface VerificationUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_joined: string;
}

// Debug files interface
export interface DebugFiles {
  logo_exists: boolean;
  cac_document_exists: boolean;
  valid_id_exists: boolean;
  logo_name: string;
  cac_document_name: string;
  valid_id_name: string;
}

// Vendor verification request interface
export interface VendorVerificationRequest {
  type: 'vendor';
  id: number;
  user: VerificationUser;
  business_name: string;
  phone: string;
  business_address: string;
  cac_number: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  debug_files?: DebugFiles;
  logo: string;
  cac_document: string;
  valid_id: string;
}

// Courier debug files interface
export interface CourierDebugFiles {
  profile_photo_exists: boolean;
  id_upload_exists: boolean;
  profile_photo_name: string;
  id_upload_name: string;
}

// Courier verification request interface
export interface CourierVerificationRequest {
  type: 'courier';
  id: number;
  user: VerificationUser;
  phone: string;
  service_areas: string;
  delivery_radius: string;
  vehicle_type: string;
  nin_number: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  debug_files?: CourierDebugFiles;
  profile_photo: string;
  id_upload: string;
}

// Union type for all verification requests
export type VerificationRequest = VendorVerificationRequest | CourierVerificationRequest;

// Verification action response interface
export interface VerificationActionResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    verification_status: 'approved' | 'rejected';
    verification_date: string;
    verification_notes: string;
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
  };
}

// Verification action request interface
export interface VerificationActionRequest {
  verification_notes?: string;
  reason?: string;
}

// Paginated response for each type
export interface PaginatedVerificationResponse {
  count: number;
  num_pages: number;
  current_page: number;
  results: VerificationRequest[];
}

// Main verification response interface
export interface AllPendingVerificationsResponse {
  vendors: PaginatedVerificationResponse;
  couriers: PaginatedVerificationResponse;
  summary: {
    total_pending: number;
    vendors_pending: number;
    couriers_pending: number;
  };
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Get all pending verifications with the new comprehensive endpoint
export const getAllPendingVerifications = async (
  type?: 'vendor' | 'courier',
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<AllPendingVerificationsResponse> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const params: any = {
      page,
      page_size: pageSize,
    };

    if (type) {
      params.type = type;
    }

    if (search) {
      params.search = search;
    }

    const queryString = new URLSearchParams(params).toString();
    const response = await apiFetch(`/admin/verification/all-pending/?${queryString}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching all pending verifications:', error);
    
    // Handle token expiration specifically
    if (error.message?.includes('token') || error.message?.includes('expired')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Get individual verification details by type and ID
export const getVerificationDetails = async (
  type: 'vendor' | 'courier',
  id: number
): Promise<VerificationRequest> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const response = await apiFetch(`/admin/verification/${type}/${id}/`);
    return response;
  } catch (error: any) {
    console.error('Error fetching verification details:', error);
    
    // Handle token expiration specifically
    if (error.message?.includes('token') || error.message?.includes('expired')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    
    throw error;
  }
};

/**
 * Approve a verification request
 */
export const approveVerification = async (
  type: 'vendor' | 'courier',
  id: number,
  verificationNotes?: string
): Promise<VerificationActionResponse> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const requestData: VerificationActionRequest = {};
    if (verificationNotes && verificationNotes.trim()) {
      requestData.verification_notes = verificationNotes;
    }

    const response = await apiFetch(`/admin/verification/${type}/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    return response;
  } catch (error: any) {
    console.error('Error approving verification:', error);
    
    // Handle token expiration specifically
    if (error.message?.includes('token') || error.message?.includes('expired')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    
    throw error;
  }
};

/**
 * Reject a verification request
 */
export const rejectVerification = async (
  type: 'vendor' | 'courier',
  id: number,
  verificationNotes?: string
): Promise<VerificationActionResponse> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  try {
    const requestData: VerificationActionRequest = {
      reason: verificationNotes || '', // Always send reason for rejections
    };

    console.log('Reject request data:', requestData);

    const response = await apiFetch(`/admin/verification/${type}/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    return response;
  } catch (error: any) {
    console.error('Error rejecting verification:', error);
    
    // Handle token expiration specifically
    if (error.message?.includes('token') || error.message?.includes('expired')) {
      removeAuthToken();
      window.location.href = '/login';
    }
    
    throw error;
  }
};

export const getPendingVerifications = async (
  type: 'vendor' | 'courier' | 'both' | 'all' = 'vendor',
  status: 'pending' | 'approved' | 'rejected' = 'pending',
  search: string = '',
  page: number = 1,
  pageSize: number = 10
): Promise<VerificationSummaryResponse> => {
  // Use getVerificationSummary for consistency
  return getVerificationSummary(type, status, search, page, pageSize);
};

export const updateVerificationStatus = async (
  id: number,
  role: 'vendor' | 'courier',
  action: 'approve' | 'reject',
  reason?: string
): Promise<void> => {
  const data: any = { action };
  if (action === 'reject' && reason) {
    data.reason = reason;
  }

  await apiFetch(`/admin/verification/${role}/${id}/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Unified summary endpoint (recommended for dashboard)
export interface VerificationSummaryItem {
  id: number;
  role: 'vendor' | 'courier';
  full_name: string;
  phone_number: string | null;
  package_type: string | null;
  date: string; // ISO
  address: string | null;
  profile_photo: string | null;
  id_image: string | null;
  cac_document: string | null;
  nin_number: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
}

export interface VendorCourierResponse {
  count: number;
  num_pages: number;
  current_page: number;
  results: Array<{
    id?: number;
    role: 'vendor' | 'courier';
    full_name: string;
    phone: string;
    package_type: string | null;
    date: string;
    address: string | null;
    profile_photo: string | null;
    id_document: string | null;
    cac_document: string | null;
  }>;
}

export interface VerificationSummaryResponse {
  vendors: VendorCourierResponse;
  couriers: VendorCourierResponse;
}

export const getVerificationSummary = async (
  type: 'vendor' | 'courier' | 'both' | 'all' = 'vendor',
  status: 'pending' | 'approved' | 'rejected' = 'pending',
  search: string = '',
  page: number = 1,
  pageSize: number = 10
): Promise<VerificationSummaryResponse> => {
  const params = new URLSearchParams();
  
  // Only add parameters if they have values
  if (type && type !== 'all') {
    params.append('type', type);
  }
  
  if (status) {
    params.append('status', status);
  }
  
  if (search) {
    params.append('search', search);
  }
  
  params.append('page', page.toString());
  params.append('page_size', Math.min(pageSize, 100).toString()); // Enforce max page size of 100

  const response = await apiFetch(`/admin/verification/summary/?${params.toString()}`);
  return response;
};
